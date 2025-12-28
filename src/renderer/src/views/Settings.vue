<template>
  <div class="settings-container">
    <div class="settings-header">
      <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
      <h2>系统设置</h2>
      <div></div>
    </div>

    <div class="settings-content">
      <!-- 左侧固定菜单栏 -->
      <div class="left-sidebar">
        <el-menu
          :default-active="activeMenu"
          @select="handleMenuSelect"
          class="settings-menu"
        >
          <el-menu-item index="persons">
            <el-icon><User /></el-icon>
            <span>人员信息</span>
          </el-menu-item>
          <el-menu-item index="shifts">
            <el-icon><Calendar /></el-icon>
            <span>班次信息</span>
          </el-menu-item>
          <el-menu-item index="weekend">
            <el-icon><Moon /></el-icon>
            <span>周末排班</span>
          </el-menu-item>
          <el-menu-item index="basic">
            <el-icon><Setting /></el-icon>
            <span>基础数据</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 右侧内容区域 -->
      <div class="content-area">
        <PersonManager
          v-if="activeMenu === 'persons'"
          :persons="persons"
          @refresh="loadPersons"
        />

        <ShiftManager
          v-if="activeMenu === 'shifts'"
          :shifts="shifts"
          :persons="persons"
          @refresh="loadShifts"
        />

        <WeekendManager
          v-if="activeMenu === 'weekend'"
          :weekend-shift="weekendShift"
          :persons="persons"
          @refresh="loadWeekendShift"
        />

        <BasicDataManager
          v-if="activeMenu === 'basic'"
          :basic-data="basicData"
          @refresh="loadBasicData"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, User, Calendar, Moon, Setting } from '@element-plus/icons-vue'
import PersonManager from '../components/PersonManager.vue'
import ShiftManager from '../components/ShiftManager.vue'
import WeekendManager from '../components/WeekendManager.vue'
import BasicDataManager from '../components/BasicDataManager.vue'
import { Person, Shift, WeekendShift, BasicData } from '../types'

const router = useRouter()
const activeMenu = ref('persons')

const persons = ref<Person[]>([])
const shifts = ref<Shift[]>([])
const weekendShift = ref<WeekendShift | null>(null)
const basicData = ref<BasicData | null>(null)

onMounted(async () => {
  await loadAllData()
})

async function loadAllData() {
  await Promise.all([
    loadPersons(),
    loadShifts(),
    loadWeekendShift(),
    loadBasicData()
  ])
}

async function loadPersons() {
  persons.value = await window.api.getAllPersons()
}

async function loadShifts() {
  const shiftsData = await window.api.getAllShifts()
  shifts.value = shiftsData.map(s => ({
    ...s,
    mondayPersonIds: JSON.parse(s.mondayPersonIds),
    fridayPersonIds: JSON.parse(s.fridayPersonIds)
  }))
}

async function loadWeekendShift() {
  const weekendShifts = await window.api.getAllWeekendShifts()
  if (weekendShifts.length > 0) {
    const shift = weekendShifts[0]
    weekendShift.value = {
      ...shift,
      leaderIds: JSON.parse(shift.leaderIds),
      pioneerIds: JSON.parse(shift.pioneerIds)
    }
  } else {
    // 创建默认周末班次
    weekendShift.value = {
      id: 0,
      name: '周末班次',
      leaderIds: [],
      pioneerIds: []
    }
  }
}

async function loadBasicData() {
  basicData.value = await window.api.getBasicData()
}

function handleMenuSelect(key: string) {
  activeMenu.value = key
}

function goBack() {
  router.push('/')
}
</script>

<style scoped>
.settings-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-header h2 {
  font-size: 20px;
  color: #333;
}

.settings-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 20px; /* 添加整体内边距，与标题栏保持距离 */
  gap: 20px; /* 左侧边栏和右侧内容的间距 */
}

.left-sidebar {
  width: 200px;
  background: white;
  border-radius: 8px; /* 添加圆角 */
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1); /* 添加阴影 */
  overflow: hidden; /* 修改为hidden，配合圆角 */
}

.content-area {
  flex: 1;
  background: white;
  border-radius: 8px; /* 添加圆角 */
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1); /* 添加阴影 */
  overflow: auto;
  padding: 24px; /* 增加内边距，营造卡片感 */
}

.settings-menu {
  border: none;
}

:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

:deep(.el-menu-item.is-active) {
  background-color: #ecf5ff;
  color: #409eff;
}

/* 为内容区域内的组件添加卡片样式 */
:deep(.person-manager),
:deep(.shift-manager),
:deep(.weekend-manager),
:deep(.basic-data-manager) {
  height: 100%;
}

:deep(.el-card) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e4e7ed;
}

:deep(.el-card__header) {
  background: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}
</style>