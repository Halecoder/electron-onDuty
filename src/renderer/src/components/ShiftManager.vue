<template>
  <div class="shift-manager">
    <div class="panel-header">
      <h3>班次信息</h3>
      <el-button type="primary" @click="showAddDialog" :icon="Plus"> 添加班次 </el-button>
    </div>

    <div class="shifts-list">
      <el-card v-for="(shift, index) in shifts" :key="shift.id" class="shift-card">
        <template #header>
          <div class="card-header">
            <span class="shift-name">{{ shift.name }}</span>
            <div>
              <el-button
                size="small"
                @click="moveShiftUp(index)"
                :disabled="index === 0"
                :icon="Top"
              >
                上移
              </el-button>
              <el-button
                size="small"
                @click="moveShiftDown(index)"
                :disabled="index === shifts.length - 1"
                :icon="Bottom"
              >
                下移
              </el-button>
              <el-button size="small" type="danger" @click="deleteShift(shift)" :icon="Delete">
                删除
              </el-button>
            </div>
          </div>
        </template>

        <div class="shift-content">
          <div class="day-section">
            <h4>周一值班人员</h4>
            <div class="person-tags">
              <el-tag
                v-for="personId in shift.mondayPersonIds"
                :key="personId"
                closable
                @close="removePersonFromShift(shift.id, 'monday', personId)"
              >
                {{ getPersonName(personId) }}
              </el-tag>
              <el-button size="small" @click="showPersonSelector(shift.id, 'monday')" :icon="Plus">
                添加人员
              </el-button>
            </div>
          </div>

          <div class="day-section">
            <h4>周五值班人员</h4>
            <div class="person-tags">
              <el-tag
                v-for="personId in shift.fridayPersonIds"
                :key="personId"
                closable
                @close="removePersonFromShift(shift.id, 'friday', personId)"
              >
                {{ getPersonName(personId) }}
              </el-tag>
              <el-button size="small" @click="showPersonSelector(shift.id, 'friday')" :icon="Plus">
                添加人员
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 添加班次对话框 -->
    <el-dialog v-model="dialogVisible" title="添加班次" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="班次名称">
          <el-input v-model="form.name" placeholder="请输入班次名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveShift">确定</el-button>
      </template>
    </el-dialog>

    <!-- 人员选择对话框 -->
    <el-dialog v-model="personSelectorVisible" title="选择人员" width="500px">
      <el-checkbox-group v-model="selectedPersons">
        <el-checkbox v-for="person in availablePersons" :key="person.id" :label="person.id">
          {{ person.name }} ({{ person.email }})
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="personSelectorVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPersonSelection">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Top, Bottom, Delete } from '@element-plus/icons-vue'
import { Person, Shift } from '../types'

const props = defineProps<{
  shifts: Shift[]
  persons: Person[]
}>()

const emit = defineEmits<{
  refresh: []
}>()

const dialogVisible = ref(false)
const personSelectorVisible = ref(false)
const currentShiftId = ref<number | null>(null)
const currentDay = ref<'monday' | 'friday'>('monday')
const selectedPersons = ref<number[]>([])

const form = reactive({
  name: ''
})

const availablePersons = computed(() => {
  if (!currentShiftId.value || !currentDay.value) return props.persons

  const currentShift = props.shifts.find((s) => s.id === currentShiftId.value)
  if (!currentShift) return props.persons

  const currentDayPersons =
    currentDay.value === 'monday' ? currentShift.mondayPersonIds : currentShift.fridayPersonIds

  return props.persons.filter((p) => !currentDayPersons.includes(p.id))
})

function showAddDialog() {
  form.name = ''
  dialogVisible.value = true
}

async function saveShift() {
  if (!form.name) {
    ElMessage.warning('请输入班次名称')
    return
  }

  try {
    const maxOrder = props.shifts.length > 0 ? Math.max(...props.shifts.map((s) => s.order)) : 0

    await window.api.addShift({
      name: form.name,
      order: maxOrder + 1,
      mondayPersonIds: JSON.stringify([]),
      fridayPersonIds: JSON.stringify([])
    })

    ElMessage.success('添加成功')
    dialogVisible.value = false
    emit('refresh')
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

async function deleteShift(shift: Shift) {
  try {
    await ElMessageBox.confirm('确定要删除该班次吗？', '提示', {
      type: 'warning'
    })

    await window.api.deleteShift(shift.id)
    ElMessage.success('删除成功')
    emit('refresh')
  } catch (error) {
    // 用户取消
  }
}

async function moveShiftUp(index: number) {
  const shift1 = props.shifts[index]
  const shift2 = props.shifts[index - 1]

  await window.api.updateShift({ ...shift1, order: shift2.order })
  await window.api.updateShift({ ...shift2, order: shift1.order })

  emit('refresh')
}

async function moveShiftDown(index: number) {
  const shift1 = props.shifts[index]
  const shift2 = props.shifts[index + 1]

  await window.api.updateShift({ ...shift1, order: shift2.order })
  await window.api.updateShift({ ...shift2, order: shift1.order })

  emit('refresh')
}

function showPersonSelector(shiftId: number, day: 'monday' | 'friday') {
  currentShiftId.value = shiftId
  currentDay.value = day
  selectedPersons.value = []
  personSelectorVisible.value = true
}

async function confirmPersonSelection() {
  if (!currentShiftId.value || !currentDay.value) return

  const currentShift = props.shifts.find((s) => s.id === currentShiftId.value)
  if (!currentShift) return

  const updatedDayPersons =
    currentDay.value === 'monday'
      ? [...currentShift.mondayPersonIds, ...selectedPersons.value]
      : [...currentShift.fridayPersonIds, ...selectedPersons.value]

  const updatedShift = {
    ...currentShift,
    mondayPersonIds:
      currentDay.value === 'monday'
        ? JSON.stringify(updatedDayPersons)
        : JSON.stringify(currentShift.mondayPersonIds),
    fridayPersonIds:
      currentDay.value === 'friday'
        ? JSON.stringify(updatedDayPersons)
        : JSON.stringify(currentShift.fridayPersonIds)
  }

  await window.api.updateShift(updatedShift)
  // 清除该班次的所有排班记录，强制重新生成
  await window.api.clearSchedulesByShiftId(currentShiftId.value)
  ElMessage.success('添加成功，排班表将自动更新')
  personSelectorVisible.value = false
  emit('refresh')
}

async function removePersonFromShift(shiftId: number, day: 'monday' | 'friday', personId: number) {
  const currentShift = props.shifts.find((s) => s.id === shiftId)
  if (!currentShift) return

  const updatedDayPersons =
    day === 'monday'
      ? currentShift.mondayPersonIds.filter((id) => id !== personId)
      : currentShift.fridayPersonIds.filter((id) => id !== personId)

  const updatedShift = {
    ...currentShift,
    mondayPersonIds:
      day === 'monday'
        ? JSON.stringify(updatedDayPersons)
        : JSON.stringify(currentShift.mondayPersonIds),
    fridayPersonIds:
      day === 'friday'
        ? JSON.stringify(updatedDayPersons)
        : JSON.stringify(currentShift.fridayPersonIds)
  }

  await window.api.updateShift(updatedShift)
  // 清除该班次的所有排班记录，强制重新生成
  await window.api.clearSchedulesByShiftId(shiftId)
  ElMessage.success('移除成功，排班表将自动更新')
  emit('refresh')
}

function getPersonName(personId: number): string {
  const person = props.persons.find((p) => p.id === personId)
  return person ? person.name : '未知人员'
}
</script>

<style scoped>
.shift-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h3 {
  font-size: 18px;
  color: #333;
}

.shifts-list {
  flex: 1;
  overflow-y: auto;
}

.shift-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shift-name {
  font-weight: bold;
  color: #333;
}

.shift-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.day-section h4 {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.person-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}
</style>
