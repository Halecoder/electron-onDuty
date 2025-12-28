<template>
  <div class="schedule-table">
    <div class="table-header">
      <h3 class="table-title">值班安排表</h3>
      <el-button
        type="warning"
        @click="handleRebuild"
        :icon="Refresh"
        class="rebuild-btn"
      >
        重建历史数据
      </el-button>
    </div>

    <!-- 确认对话框 -->
    <el-dialog
      v-model="rebuildConfirmVisible"
      title="确认重建"
      width="400px"
    >
      <p>确定要重建所有值班历史数据吗？</p>
      <p class="warning-text">此操作将删除所有历史排班记录，但不会删除人员和班次配置。</p>
      <template #footer>
        <el-button @click="rebuildConfirmVisible = false">取消</el-button>
        <el-button type="warning" @click="confirmRebuild">确定重建</el-button>
      </template>
    </el-dialog>

    <el-table :data="tableData" border style="width: 100%" :cell-style="getCellStyle">
      <el-table-column label="姓名（邮箱）" width="300" fixed>
        <template #default="scope"> {{ scope.row.name }}（{{ scope.row.email }}） </template>
      </el-table-column>

      <el-table-column
        v-for="(day, index) in allDays"
        :key="day"
        :label="day"
        align="center"
        width="120"
      >
        <template #default="scope">
          <span v-if="scope.row[`day${index}`]">✓</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Person, WeekSchedule, WeekendSchedule } from '../types'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps<{
  persons: Person[]
  weekdaySchedule: WeekSchedule
  weekendSchedule: WeekendSchedule
  weekStart: string
}>()

const allDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const scheduleKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const


const emit = defineEmits<{
  rebuild: []
  refresh: []
}>()

const rebuildConfirmVisible = ref(false)

// 处理重建按钮点击
function handleRebuild() {
  rebuildConfirmVisible.value = true
}

// 确认重建
async function confirmRebuild() {
  try {
    emit('rebuild')
    ElMessage.success('值班历史数据已重建')
    rebuildConfirmVisible.value = false
    emit('refresh')
  } catch (error) {
    ElMessage.error('重建失败，请重试')
  }
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
          fontWeight: 'bold'
        }
      } else if (dayIndex === 6) { // 周日
        return {
          backgroundColor: '#e6a23c',
          color: 'white',
          fontWeight: 'bold'
        }
      } else { // 工作日
        return {
          backgroundColor: '#67c23a',
          color: 'white',
          fontWeight: 'bold'
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
  font-size: 18px;
  color: #333;
  font-weight: bold;
}

.rebuild-btn {
  font-size: 14px;
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