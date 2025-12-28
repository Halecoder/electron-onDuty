<template>
    <div class="weekend-table">
      <h3 class="table-title">周末值班</h3>
      <el-table
        :data="tableData"
        border
        style="width: 100%"
        :cell-style="getCellStyle"
      >
      <el-table-column label="姓名（邮箱）" width="300" fixed>
        <template #default="scope"> {{ scope.row.name }}（{{ scope.row.email }}） </template>
      </el-table-column>
        <el-table-column
          label="周六"
          align="center"
          width="120"
        >
          <template #default="scope">
            <span v-if="scope.row.saturday">✓</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </template>

  <script setup lang="ts">
  import { computed } from 'vue'
  import { Person, WeekendSchedule } from '../types'

  const props = defineProps<{
    persons: Person[]
    schedule: WeekendSchedule
    weekStart: string
  }>()

  const tableData = computed(() => {
    return props.persons.map(person => ({
      name: person.name,
      email: person.email,
      saturday: props.schedule.saturday.includes(person.id)
    }))
  })

  function getCellStyle({ row, column, rowIndex, columnIndex }) {
    if (columnIndex === 1) { // 周六列
      if (row.saturday) {
        return {
          backgroundColor: '#e6a23c',
          color: 'white',
          fontWeight: 'bold'
        }
      }
    }

    return {}
  }
  </script>

  <style scoped>
  .weekend-table {
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
    background: #fdf6ec;
    color: #333;
    font-weight: bold;
  }
  </style>