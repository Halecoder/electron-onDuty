<template>
  <div class="day-table">
    <h3 class="table-title">工作日值班</h3>
    <el-table :data="tableData" border style="width: 100%" :cell-style="getCellStyle">
      <el-table-column label="姓名（邮箱）" width="300" fixed>
        <template #default="scope"> {{ scope.row.name }}（{{ scope.row.email }}） </template>
      </el-table-column>

      <el-table-column
        v-for="(day, index) in weekDays"
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
import { computed } from 'vue'
import { Person, WeekSchedule } from '../types'
import { getWeekDates } from '../utils/schedule'

const props = defineProps<{
  persons: Person[]
  schedule: WeekSchedule
  weekStart: string
}>()

const weekDays = ['周一', '周二', '周三', '周四', '周五']
const scheduleKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const

const tableData = computed(() => {
  return props.persons.map((person) => {
    const row: any = {
      name: person.name,
      email: person.email
    }

    scheduleKeys.forEach((key, index) => {
      row[`day${index}`] = props.schedule[key][person.id] || false
    })

    return row
  })
})

function getCellStyle({ row, column, rowIndex, columnIndex }) {
  if (columnIndex >= 1) {
    const dayIndex = columnIndex - 1
    const isOnDuty = row[`day${dayIndex}`]

    if (isOnDuty) {
      return {
        backgroundColor: '#67c23a',
        color: 'white',
        fontWeight: 'bold'
      }
    }
  }

  return {}
}
</script>

<style scoped>
.day-table {
  margin-top: 30px;
}

.table-title {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
  font-weight: bold;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table__header th) {
  background: #f5f7fa;
  color: #333;
  font-weight: bold;
}
</style>
