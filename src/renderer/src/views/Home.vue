<template>
  <div class="home-container">
    <div class="header">
      <el-button @click="gotoPreviousWeek" :icon="ArrowLeft"> 上一周 </el-button>

      <div class="week-title">
        <h2>{{ formatDate(currentWeekStart) }} 值班安排</h2>
        <p class="shift-name" v-if="currentShift">班次：{{ currentShift.name }}</p>
      </div>

      <el-button @click="gotoNextWeek" :icon="ArrowRight"> 下一周 </el-button>

      <el-button type="primary" @click="gotoSettings" :icon="Setting" class="settings-btn">
        设置
      </el-button>
    </div>

    <div class="table-container">
      <ScheduleTable
        v-if="schedule && persons.length > 0"
        :persons="persons"
        :schedule="schedule"
        :week-start="currentWeekStart"
      />
      <el-empty v-else description="请先在设置页面配置人员和班次信息" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Setting } from '@element-plus/icons-vue'
import ScheduleTable from '../components/ScheduleTable.vue'
import { Person, Shift, WeekSchedule } from '../types'
import {
  getWeekStart,
  getNextWeekStart,
  getPreviousWeekStart,
  formatDate,
  generateSchedule
} from '../utils/schedule'

const router = useRouter()
const currentWeekStart = ref('')
const persons = ref<Person[]>([])
const shifts = ref<Shift[]>([])
const schedule = ref<WeekSchedule | null>(null)
const currentShift = ref<Shift | null>(null)

onMounted(async () => {
  currentWeekStart.value = getWeekStart(new Date())
  await loadData()
  await loadSchedule()
})

// 添加页面激活时的刷新
onActivated(async () => {
  await loadData()
  await loadSchedule()
})

async function loadData() {
  const personsData = await window.api.getAllPersons()
  const shiftsData = await window.api.getAllShifts()

  persons.value = personsData
  shifts.value = shiftsData.map((s) => ({
    ...s,
    mondayPersonIds: JSON.parse(s.mondayPersonIds),
    fridayPersonIds: JSON.parse(s.fridayPersonIds)
  }))
}

async function loadSchedule() {
  if (shifts.value.length === 0) {
    schedule.value = null
    currentShift.value = null
    return
  }

  // 尝试从数据库加载
  const savedSchedule = await window.api.getSchedule(currentWeekStart.value)

  if (savedSchedule) {
    schedule.value = JSON.parse(savedSchedule.scheduleData)
    currentShift.value = shifts.value.find((s) => s.id === savedSchedule.shiftId) || null
  } else {
    // 生成新的排班
    const shiftIndex = getShiftIndexForWeek(currentWeekStart.value)
    currentShift.value = shifts.value[shiftIndex]
    schedule.value = generateSchedule(persons.value, currentShift.value)

    // 保存到数据库
    await window.api.saveSchedule({
      weekStart: currentWeekStart.value,
      shiftId: currentShift.value.id,
      scheduleData: JSON.stringify(schedule.value)
    })
  }
}

// 根据当前周与基准周之间相差多少周，决定当前使用哪个班次。
function getShiftIndexForWeek(weekStart: string): number {
  // 计算从基准日期（2024-01-01）到当前周的周数
  const baseDate = new Date('2024-01-01')
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
  padding: 20px;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
  position: relative;
}

.week-title {
  text-align: center;
}

.week-title h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 5px;
}

.shift-name {
  font-size: 14px;
  color: #666;
}

.settings-btn {
  position: absolute;
  right: 0;
}

.table-container {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 20px;
  overflow: auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
</style>
