<template>
  <div class="weekend-manager">
    <div class="panel-header">
      <h3>周末排班配置</h3>
    </div>

    <el-card class="weekend-card">
      <template #header>
        <div class="card-header">
          <span>周末值班人员配置</span>
        </div>
      </template>

      <div class="config-section">
        <h4>组长人员</h4>
        <div class="person-tags">
          <el-tag
            v-for="personId in weekendShift?.leaderIds || []"
            :key="personId"
            closable
            @close="removeLeader(personId)"
          >
            {{ getPersonName(personId) }}
          </el-tag>
          <el-button size="small" @click="showLeaderSelector" :icon="Plus"> 添加组长 </el-button>
        </div>
      </div>

      <div class="config-section">
        <h4>加班先锋人员</h4>
        <div class="person-tags">
          <el-tag
            v-for="personId in weekendShift?.pioneerIds || []"
            :key="personId"
            closable
            @close="removePioneer(personId)"
            type="warning"
          >
            {{ getPersonName(personId) }}
          </el-tag>
          <el-button size="small" @click="showPioneerSelector" :icon="Plus">
            添加加班先锋
          </el-button>
        </div>
      </div>

      <el-divider />

      <div class="preview-section">
        <h4>排班规则预览</h4>
        <p>周末值班规则1：</p>
        <div class="rotation-preview">
          <el-tag v-for="person in getRotationPreview()" :key="person.id">
            {{ person.name }}
          </el-tag>
        </div>
        <p class="preview-tip">规则1将从以上特殊人员中轮流选择一位值班</p>
      </div>

      <div class="rotation-group">
        <p>周末值班规则2：</p>
        <div class="rotation-preview">
          <el-tag
            v-for="person in getRegularPersons(props.persons, props.weekendShift)"
            :key="person.id"
            type="info"
          >
            {{ person.name }}
          </el-tag>
        </div>
        <p class="preview-tip">规则2将从以上普通人员中轮流选择一位值班</p>
      </div>
    </el-card>

    <!-- 人员选择对话框 -->
    <el-dialog
      v-model="selectorVisible"
      :title="selectorType === 'leader' ? '选择组长' : '选择加班先锋'"
      width="500px"
    >
      <el-checkbox-group v-model="selectedPersons">
        <el-checkbox v-for="person in availablePersons" :key="person.id" :label="person.id">
          {{ person.name }} ({{ person.email }})
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="selectorVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSelection">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { WeekendShift, Person } from '../types'

const props = defineProps<{
  weekendShift: WeekendShift | null
  persons: Person[]
}>()

const emit = defineEmits<{
  refresh: []
}>()

const selectorVisible = ref(false)
const selectorType = ref<'leader' | 'pioneer'>('leader')
const selectedPersons = ref<number[]>([])

const availablePersons = computed(() => {
  if (!props.weekendShift || !selectorType.value) return props.persons

  const currentIds =
    selectorType.value === 'leader' ? props.weekendShift.leaderIds : props.weekendShift.pioneerIds

  return props.persons.filter((p) => !currentIds.includes(p.id))
})

function showLeaderSelector() {
  selectorType.value = 'leader'
  selectedPersons.value = []
  selectorVisible.value = true
}

function showPioneerSelector() {
  selectorType.value = 'pioneer'
  selectedPersons.value = []
  selectorVisible.value = true
}

async function confirmSelection() {
  if (!props.weekendShift) return

  const updatedShift = { ...props.weekendShift }

  if (selectorType.value === 'leader') {
    updatedShift.leaderIds = [...props.weekendShift.leaderIds, ...selectedPersons.value]
  } else {
    updatedShift.pioneerIds = [...props.weekendShift.pioneerIds, ...selectedPersons.value]
  }

  await window.api.updateWeekendShift({
    ...updatedShift,
    leaderIds: JSON.stringify(updatedShift.leaderIds),
    pioneerIds: JSON.stringify(updatedShift.pioneerIds)
  })

  ElMessage.success('添加成功')
  selectorVisible.value = false
  emit('refresh')
}

async function removeLeader(personId: number) {
  if (!props.weekendShift) return

  const updatedLeaderIds = props.weekendShift.leaderIds.filter((id) => id !== personId)

  await window.api.updateWeekendShift({
    ...props.weekendShift,
    leaderIds: JSON.stringify(updatedLeaderIds)
  })

  ElMessage.success('移除成功')
  emit('refresh')
}

async function removePioneer(personId: number) {
  if (!props.weekendShift) return

  const updatedPioneerIds = props.weekendShift.pioneerIds.filter((id) => id !== personId)

  await window.api.updateWeekendShift({
    ...props.weekendShift,
    pioneerIds: JSON.stringify(updatedPioneerIds)
  })

  ElMessage.success('移除成功')
  emit('refresh')
}

function getPersonName(personId: number): string {
  const person = props.persons.find((p) => p.id === personId)
  return person ? person.name : '未知人员'
}

function getRotationPreview(): Person[] {
  if (!props.weekendShift) return []

  const rotation: Person[] = []
  const leaders = props.weekendShift.leaderIds.map(id =>
    props.persons.find(p => p.id === id)
  ).filter(Boolean) as Person[]

  const pioneers = props.weekendShift.pioneerIds.map(id =>
    props.persons.find(p => p.id === id)
  ).filter(Boolean) as Person[]

  const pioneerQueue: Person[] = [...pioneers]
  const pendingSecondRound: Person[] = []

  for (let i = 0; i < leaders.length; i++) {
    rotation.push(leaders[i])

    // 插入上一个先锋的第二次出现
    if (pendingSecondRound.length > 0) {
      const pioneer = pendingSecondRound.shift()!
      rotation.push(pioneer)
    }

    // 插入新的先锋的第一次出现
    if (pioneerQueue.length > 0) {
      const pioneer = pioneerQueue.shift()!
      rotation.push(pioneer)
      pendingSecondRound.push(pioneer)
    }
  }

  return rotation
}

// 新增：获取普通人员（排除组长和加班先锋）
function getRegularPersons(persons: Person[], weekendShift: WeekendShift): Person[] {
  if (!weekendShift) return persons

  const leaderIds = new Set(weekendShift.leaderIds)
  const pioneerIds = new Set(weekendShift.pioneerIds)
  const excludedIds = new Set([...leaderIds, ...pioneerIds])

  return persons.filter((person) => !excludedIds.has(person.id))
}
</script>

<style scoped>
.weekend-manager {
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

.weekend-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.config-section {
  margin-bottom: 30px;
}

.config-section h4 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
}

.person-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.preview-section h4 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
}

.preview-section p {
  color: #666;
  margin-bottom: 15px;
}

.rotation-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.rotation-group {
  margin-top: 25px;
}

.rotation-group p {
  color: #666;
  margin-bottom: 15px;
}

.rotation-group:last-child {
  margin-bottom: 0;
}

.preview-tip {
  font-size: 12px;
  color: #999;
  margin-top: 10px;
  margin-bottom: 0;
}
</style>
