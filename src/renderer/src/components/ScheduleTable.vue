<template>
    <el-table
      :data="tableData"
      border
      style="width: 100%"
      :cell-style="getCellStyle"
    >
      <el-table-column
        prop="name"
        label="姓名"
        width="150"
        fixed
      />
      <el-table-column
        prop="email"
        label="邮箱"
        width="200"
        fixed
      />
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
    return props.persons.map(person => {
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
    if (columnIndex >= 2) {
      const dayIndex = columnIndex - 2
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
  :deep(.el-table) {
    font-size: 14px;
  }

  :deep(.el-table__header th) {
    background: #f5f7fa;
    color: #333;
    font-weight: bold;
  }
  </style>