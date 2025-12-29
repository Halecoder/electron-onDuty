<template>
  <div class="home-container">
    <div class="header">
      <el-button @click="gotoPreviousWeek" :icon="ArrowLeft"> 上一周 </el-button>
      <div class="week-title">
          <h2>{{ formatDate(currentWeekStart) }} 值班安排</h2>
          <p class="shift-name" v-if="currentShift">班次：{{ currentShift.name }}</p>
        </div>
      <el-button @click="gotoNextWeek" :icon="ArrowRight"> 下一周 </el-button>

      <!-- <div class="week-selector">
        <el-date-picker
          v-model="selectedWeek"
          type="week"
          format="YYYY 第 ww 周"
          value-format="YYYY-MM-DD"
          placeholder="选择周"
          @change="handleWeekChange"
          :clearable="false"
        />
      </div> -->

      <el-button type="primary" @click="gotoSettings" :icon="Setting" class="settings-btn">
        设置
      </el-button>
    </div>

    <div class="container">
      <div class="table-container">
        <!-- 使用统一的表格组件 -->
         <ScheduleTable
          v-if="schedule && weekendSchedule && persons.length > 0"
          :persons="persons"
          :weekday-schedule="schedule"
          :weekend-schedule="weekendSchedule"
          :week-start="currentWeekStart"
          :weekend-shift="weekendShift"
          :basic-data="basicData"
          @rebuild-before="handleRebuildScheduleBefore"
          @rebuild-from="handleRebuildScheduleFrom"
          @refresh="loadSchedule"
        />

        <el-empty v-else description="请先在右上角设置页面配置人员和班次信息" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Setting } from '@element-plus/icons-vue'
import ScheduleTable from '../components/ScheduleTable.vue'
import { Person, Shift, WeekSchedule, WeekendShift, BasicData, WeekendSchedule } from '../types'
import {
  getWeekStart,
  getNextWeekStart,
  getPreviousWeekStart,
  formatDate,
  generateSchedule,
  generateWeekendSchedule
} from '../utils/schedule'

const router = useRouter()
const currentWeekStart = ref('')
const persons = ref<Person[]>([])
const shifts = ref<Shift[]>([])
const weekendShift = ref<WeekendShift | null>(null)
const basicData = ref<BasicData | null>(null)
const schedule = ref<WeekSchedule | null>(null)
const weekendSchedule = ref<WeekendSchedule | null>(null)
const currentShift = ref<Shift | null>(null)
const selectedWeek = ref('')

onMounted(async () => {
  currentWeekStart.value = getWeekStart(new Date())
  selectedWeek.value = currentWeekStart.value

  await loadData()
  await loadSchedule()
})

async function loadData() {
  const personsData = await window.api.getAllPersons()
  const shiftsData = await window.api.getAllShifts()
  const weekendShiftsData = await window.api.getAllWeekendShifts()
  const basicDataData = await window.api.getBasicData()

  persons.value = personsData
  shifts.value = shiftsData.map((s) => ({
    ...s,
    mondayPersonIds: JSON.parse(s.mondayPersonIds),
    fridayPersonIds: JSON.parse(s.fridayPersonIds)
  }))

  if (weekendShiftsData.length > 0) {
    const shift = weekendShiftsData[0]
    weekendShift.value = {
      ...shift,
      leaderIds: JSON.parse(shift.leaderIds),
      pioneerIds: JSON.parse(shift.pioneerIds)
    }
  }

  basicData.value = basicDataData
}

// 添加重建处理函数
async function handleRebuildSchedule() {
  try {
    await window.api.clearAllSchedules()
  } catch (error) {
    throw new Error('重建失败')
  }
}

// 重建本周前的历史数据
async function handleRebuildScheduleBefore() {
  try {
    await window.api.clearSchedulesBeforeWeek(currentWeekStart.value)
  } catch (error) {
    throw new Error('重建失败')
  }
}

// 重置本周及以后的数据
async function handleRebuildScheduleFrom() {
  try {
    await window.api.clearSchedulesFromWeek(currentWeekStart.value)
  } catch (error) {
    throw new Error('重置失败')
  }
}

async function handleWeekChange(value: string) {
  if (value) {
    currentWeekStart.value = getWeekStart(new Date(value))
    await loadSchedule()
  }
}

// 监听 currentWeekStart 变化，同步更新日历选择器
watch(currentWeekStart, (newValue) => {
  selectedWeek.value = newValue
})

async function loadSchedule() {
  // 加载工作日排班（现有逻辑保持不变）
  if (shifts.value.length === 0) {
    schedule.value = null
    currentShift.value = null
  } else {
    const savedSchedule = await window.api.getSchedule(currentWeekStart.value)

    if (savedSchedule) {
      schedule.value = JSON.parse(savedSchedule.scheduleData)
      currentShift.value = shifts.value.find((s) => s.id === savedSchedule.shiftId) || null
    } else {
      const shiftIndex = getShiftIndexForWeek(currentWeekStart.value)
      currentShift.value = shifts.value[shiftIndex]
      schedule.value = generateSchedule(persons.value, currentShift.value)

      await window.api.saveSchedule({
        weekStart: currentWeekStart.value,
        shiftId: currentShift.value.id,
        scheduleData: JSON.stringify(schedule.value)
      })
    }
  }

  // 修改周末排班加载逻辑
  if (weekendShift.value && basicData.value) {
    // 先尝试加载手动保存的周末排班
    const savedWeekendSchedule = await window.api.getWeekendSchedule(currentWeekStart.value)

    if (savedWeekendSchedule) {
      // 使用手动保存的数据
      weekendSchedule.value = {
        saturday: JSON.parse(savedWeekendSchedule.saturday),
        sunday: JSON.parse(savedWeekendSchedule.sunday)
      }
    } else {
      // 没有手动保存的数据，使用自动生成的
      weekendSchedule.value = generateWeekendSchedule(
        persons.value,
        weekendShift.value,
        basicData.value,
        currentWeekStart.value
      )
    }
  } else {
    weekendSchedule.value = null
  }
}

function getShiftIndexForWeek(weekStart: string): number {
  loadData()
  const baseDate = new Date(basicData.value.baseWeek)
  const currentDate = new Date(weekStart)
  const weeksDiff = Math.floor(
    (currentDate.getTime() - baseDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
  )

  return weeksDiff % shifts.value.length
}

async function gotoPreviousWeek() {
  currentWeekStart.value = getPreviousWeekStart(currentWeekStart.value)
  await loadSchedule()
}

async function gotoNextWeek() {
  currentWeekStart.value = getNextWeekStart(currentWeekStart.value)
  await loadSchedule()
}

function gotoSettings() {
  router.push('/settings')
}
</script>

<style scoped>
.home-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.container {
  flex: 1;
  display: flex;
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  background: white;
  position: relative;
}

.week-title {
  text-align: center;
}

.week-title h2 {
  font-size: 22px;
  color: #333;
  margin-bottom: 5px;
}

.shift-name {
  font-size: 14px;
  color: #666;
}

.settings-btn {
  position: absolute;
  right: 20px;
}

.table-container {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 24px;
  overflow: auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 为表格组件添加卡片样式 */
:deep(.schedule-table),
:deep(.weekend-table) {
  margin-bottom: 30px;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table__header) {
  background: #fafafa;
}

:deep(.el-empty) {
  padding: 60px 0;
}
</style>
