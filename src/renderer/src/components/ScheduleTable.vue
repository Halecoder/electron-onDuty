<template>
  <div class="schedule-table">
    <div class="table-header">
      <h3 class="table-title">值班安排表</h3>
      <div class="button-group">
        <el-button
          type="warning"
          @click="handleRebuildBefore"
          :icon="Refresh"
          class="rebuild-btn"
        >
          重建历史数据（本周前）
        </el-button>
        <el-button
          type="danger"
          @click="handleRebuildFrom"
          :icon="Refresh"
          class="rebuild-btn"
        >
          重置本周数据
        </el-button>
      </div>
    </div>

    <!-- 重建本周前数据确认对话框 -->
    <el-dialog
      v-model="rebuildBeforeConfirmVisible"
      title="确认重建"
      width="400px"
    >
      <p>确定要重建本周之前的所有值班历史数据吗？</p>
      <p class="warning-text">此操作将删除本周之前的历史排班记录，本周及以后数据保留。</p>
      <template #footer>
        <el-button @click="rebuildBeforeConfirmVisible = false">取消</el-button>
        <el-button type="warning" @click="confirmRebuildBefore">确定重建</el-button>
      </template>
    </el-dialog>

    <!-- 重置本周数据确认对话框 -->
    <el-dialog
      v-model="rebuildFromConfirmVisible"
      title="确认重置"
      width="400px"
    >
      <p>确定要重置本周及以后的所有值班数据吗？</p>
      <p class="warning-text">此操作将删除本周及以后的排班记录，本周之前历史数据保留。</p>
      <template #footer>
        <el-button @click="rebuildFromConfirmVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmRebuildFrom">确定重置</el-button>
      </template>
    </el-dialog>

    <!-- 修改基准索引对话框 -->
    <el-dialog
      v-model="indexDialogVisible"
      title="修改基准索引"
      width="600px"
    >
      <el-form label-width="200px">
        <el-form-item :label="contextMenuDay === 5 ? '周六排班索引（规则1）' : '周日排班索引（规则2）'">
          <el-input-number
            v-model="tempIndexValue"
            :min="0"
            :max="999"
            controls-position="right"
          />
        </el-form-item>
      </el-form>

      <el-divider />

      <div class="preview-section">
        <h4>{{ contextMenuDay === 5 ? '规则1预览（周六值班）' : '规则2预览（周日值班）' }}</h4>
        <div class="rotation-preview">
          <el-tag
            v-for="person in getIndexPreview()"
            :key="person.id"
            :type="contextMenuDay === 5 ? '' : 'info'"
          >
            {{ person.name }}
          </el-tag>
        </div>
        <p class="preview-tip">
          {{ contextMenuDay === 5
            ? '规则1将从以上特殊人员（组长、加班先锋）中轮流选择一位值班'
            : '规则2将从以上普通人员中轮流选择一位值班' }}
        </p>
      </div>

      <template #footer>
        <el-button @click="indexDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmIndexChange">确定</el-button>
      </template>
    </el-dialog>

    <el-table
      :data="tableData"
      border
      style="width: 100%"
      :cell-style="getCellStyle"
      @cell-click="handleCellClick"
      @header-contextmenu="handleCellContextMenu"
    >
      <el-table-column label="姓名（邮箱）" min-width="300" fixed>
        <template #default="scope"> {{ scope.row.name }}（{{ scope.row.email }}） </template>
      </el-table-column>

      <el-table-column
        v-for="(day, index) in allDays"
        :key="day"
        :label="day"
        align="center"
        min-width="160"
      >
        <template #default="scope">
          <span v-if="scope.row[`day${index}`]">✓</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Person, WeekSchedule, WeekendSchedule, WeekendShift, BasicData } from '../types'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

const props = defineProps<{
  persons: Person[]
  weekdaySchedule: WeekSchedule
  weekendSchedule: WeekendSchedule
  weekStart: string
  weekendShift: WeekendShift | null
  basicData: BasicData | null
}>()

const allDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const scheduleKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const

const emit = defineEmits<{
  rebuildBefore: []
  rebuildFrom: []
  refresh: []
}>()

const rebuildBeforeConfirmVisible = ref(false)
const rebuildFromConfirmVisible = ref(false)
const indexDialogVisible = ref(false)
const contextMenuDay = ref<number>(5) // 5=周六, 6=周日
const tempIndexValue = ref(0)

// 处理重建本周前数据按钮点击
function handleRebuildBefore() {
  rebuildBeforeConfirmVisible.value = true
}

// 处理重置本周数据按钮点击
function handleRebuildFrom() {
  rebuildFromConfirmVisible.value = true
}

// 确认重建本周前数据
async function confirmRebuildBefore() {
  try {
    emit('rebuildBefore')
    ElMessage.success('本周前值班历史数据已重建')
    rebuildBeforeConfirmVisible.value = false
    emit('refresh')
  } catch (error) {
    ElMessage.error('重建失败，请重试')
  }
}

// 确认重置本周数据
async function confirmRebuildFrom() {
  try {
    emit('rebuildFrom')
    ElMessage.success('本周数据已重置')
    rebuildFromConfirmVisible.value = false
    emit('refresh')
  } catch (error) {
    ElMessage.error('重置失败，请重试')
  }
}

// 处理单元格点击
async function handleCellClick(row: any, column: any, cell: any, event: Event) {
  const columnIndex = parseInt(column.no) - 1

  // 只处理日期列（不包括姓名列）
  if (columnIndex >= 0 && columnIndex <= 6) {
    const person = props.persons.find(p => p.name === row.name && p.email === row.email)
    if (!person) return

    const dayIndex = columnIndex
    const currentValue = row[`day${dayIndex}`]

    // 工作日（周一到周五）
    if (dayIndex <= 4) {
      const dayKey = scheduleKeys[dayIndex]
      const newSchedule = { ...props.weekdaySchedule }

      if (currentValue) {
        // 清除值班
        delete newSchedule[dayKey][person.id]
      } else {
        // 添加值班
        newSchedule[dayKey][person.id] = true
      }

      // 保存到数据库
      await window.api.saveSchedule({
        weekStart: props.weekStart,
        shiftId: await getCurrentShiftId(),
        scheduleData: JSON.stringify(newSchedule)
      })

      ElMessage.success(currentValue ? '已清除值班' : '已添加值班')
      emit('refresh')
    }
    // 周末（周六、周日）
    else if (dayIndex === 5 || dayIndex === 6) {
      const isSaturday = dayIndex === 5
      const newWeekendSchedule = { ...props.weekendSchedule }

      if (currentValue) {
        // 取消周末值班
        if (isSaturday) {
          newWeekendSchedule.saturday = newWeekendSchedule.saturday.filter(id => id !== person.id)
        } else {
          newWeekendSchedule.sunday = newWeekendSchedule.sunday.filter(id => id !== person.id)
        }

        ElMessage.success('已取消周末值班')
      } else {
        // 添加周末值班（手动指定）
        if (isSaturday) {
          if (!newWeekendSchedule.saturday.includes(person.id)) {
            newWeekendSchedule.saturday.push(person.id)
          }
        } else {
          if (!newWeekendSchedule.sunday.includes(person.id)) {
            newWeekendSchedule.sunday.push(person.id)
          }
        }

        ElMessage.success('已添加周末值班')
      }

      // 保存周末排班修改到数据库
      await window.api.saveWeekendSchedule({
        weekStart: props.weekStart,
        saturday: JSON.stringify(newWeekendSchedule.saturday),
        sunday: JSON.stringify(newWeekendSchedule.sunday)
      })

      emit('refresh')
    }
  }
}

// 处理单元格右键菜单
function handleCellContextMenu(row: any, column: any, event: Event) {
  const columnIndex = parseInt(row.no) - 1

  // 只处理周六（5）和周日（6）列
  if (columnIndex === 5 || columnIndex === 6) {
    // event.preventDefault()
    contextMenuDay.value = columnIndex

    // 设置当前索引值
    if (props.basicData) {
      tempIndexValue.value = columnIndex === 5
        ? props.basicData.weekendRotationIndex_1
        : props.basicData.weekendRotationIndex_2
    }

    indexDialogVisible.value = true
  }
}

// 获取当前班次ID
async function getCurrentShiftId(): Promise<number> {
  const schedule = await window.api.getSchedule(props.weekStart)
  return schedule?.shiftId || 1
}

// 确认修改索引
async function confirmIndexChange() {
  if (!props.basicData) return

  try {
    const updatedData = { ...props.basicData }
    if (contextMenuDay.value === 5) {
      updatedData.weekendRotationIndex_1 = tempIndexValue.value
    } else {
      updatedData.weekendRotationIndex_2 = tempIndexValue.value
    }

    await window.api.updateBasicData(updatedData)

    // 清除本周及以后的数据以触发重新生成
    await window.api.clearSchedulesFromWeek(props.weekStart)

    ElMessage.success('基准索引已更新，周末排班已重新生成')
    indexDialogVisible.value = false
    emit('refresh')
  } catch (error) {
    ElMessage.error('更新失败，请重试')
  }
}

// 获取索引预览数据
function getIndexPreview(): Person[] {
  if (!props.weekendShift || !props.persons) return []

  if (contextMenuDay.value === 5) {
    // 周六：规则1预览（组长和加班先锋）
    return getWeekendRotationList(props.persons, props.weekendShift)
  } else {
    // 周日：规则2预览（普通人员）
    return getRegularPersons(props.persons, props.weekendShift)
  }
}

// 获取周末轮换列表（规则1）
function getWeekendRotationList(persons: Person[], weekendShift: WeekendShift): Person[] {
  const rotation: Person[] = []

  const leaders = weekendShift.leaderIds
    .map(id => persons.find(p => p.id === id))
    .filter((p): p is Person => !!p)

  const pioneers = weekendShift.pioneerIds
    .map(id => persons.find(p => p.id === id))
    .filter((p): p is Person => !!p)

  const pioneerQueue = [...pioneers]
  const pendingSecondRound: Person[] = []

  for (let i = 0; i < leaders.length; i++) {
    const leader = leaders[i]
    rotation.push(leader)

    // 插入上一个先锋的第二次出现
    const secondPioneer = pendingSecondRound.shift()
    if (secondPioneer) {
      rotation.push(secondPioneer)
    }

    // 插入新的先锋的第一次出现
    const newPioneer = pioneerQueue.shift()
    if (newPioneer) {
      rotation.push(newPioneer)
      pendingSecondRound.push(newPioneer)
    }
  }

  // 如果还有未插入第二次的先锋，继续插入
  for (const pioneer of pendingSecondRound) {
    rotation.push(pioneer)
  }

  return rotation
}

// 获取普通人员（规则2）
function getRegularPersons(persons: Person[], weekendShift: WeekendShift): Person[] {
  if (!weekendShift) return persons

  const leaderIds = new Set(weekendShift.leaderIds)
  const pioneerIds = new Set(weekendShift.pioneerIds)
  const excludedIds = new Set([...leaderIds, ...pioneerIds])

  return persons.filter(person => !excludedIds.has(person.id))
}

const tableData = computed(() => {
  return props.persons.map((person) => {
    const row: any = {
      name: person.name,
      email: person.email
    }

    // 处理工作日数据 (周一到周五)
    scheduleKeys.forEach((key, index) => {
      row[`day${index}`] = props.weekdaySchedule[key][person.id] || false
    })

    // 处理周末数据 (周六和周日)
    row[`day5`] = props.weekendSchedule.saturday.includes(person.id)
    row[`day6`] = props.weekendSchedule.sunday.includes(person.id)

    return row
  })
})

function getCellStyle({ row, column, rowIndex, columnIndex }) {
  if (columnIndex >= 1) {
    const dayIndex = columnIndex - 1
    const isOnDuty = row[`day${dayIndex}`]

    if (isOnDuty) {
      // 周六\周日使用橙色，其他工作日使用绿色
      if (dayIndex === 5) { // 周六
        return {
          backgroundColor: '#e6a23c',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'context-menu'
        }
      } else if (dayIndex === 6) { // 周日
        return {
          backgroundColor: '#e6a23c',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'context-menu'
        }
      } else { // 工作日
        return {
          backgroundColor: '#67c23a',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer'
        }
      }
    } else {
      // 未填充的单元格也显示可点击光标
      if (dayIndex <= 4) {
        return {
          cursor: 'pointer'
        }
      } else {
        return {
          cursor: 'context-menu'
        }
      }
    }
  }

  return {}
}
</script>

<style scoped>
.schedule-table {
  margin-top: 30px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.table-title {
  font-size: 30px;
  color: #333;
  font-weight: bold;
}

.button-group {
  display: flex;
  gap: 10px;
}

.rebuild-btn {
  font-size: 14px;
}

.warning-text {
  color: #e6a23c;
  font-size: 14px;
}

.preview-section {
  margin-top: 20px;
}

.preview-section h4 {
  font-size: 16px;
  color: #333;
  margin-bottom: 15px;
}

.rotation-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.preview-tip {
  font-size: 12px;
  color: #999;
  margin-top: 10px;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table__header th) {
  background: #f5f7fa;
  color: #333;
  font-weight: bold;
}

/* 周六列使用不同的背景色 */
:deep(.el-table__header th:nth-child(7)) {
  background: #fdf6ec;
}

/* 周日列使用不同的背景色 */
:deep(.el-table__header th:nth-child(8)) {
  background: #fdf6ec;
}
</style>