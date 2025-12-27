<template>
    <div class="settings-container">
      <div class="settings-header">
        <el-button @click="goBack" :icon="ArrowLeft">返回</el-button>
        <h2>系统设置</h2>
        <div></div>
      </div>

      <div class="settings-content">
        <div class="left-panel">
          <PersonManager
            :persons="persons"
            @refresh="loadPersons"
          />
        </div>

        <div class="right-panel">
          <ShiftManager
            :shifts="shifts"
            :persons="persons"
            @refresh="loadShifts"
          />
        </div>
      </div>
    </div>
  </template>

  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { ArrowLeft } from '@element-plus/icons-vue'
  import PersonManager from '../components/PersonManager.vue'
  import ShiftManager from '../components/ShiftManager.vue'
  import { Person, Shift } from '../types'

  const router = useRouter()
  const persons = ref<Person[]>([])
  const shifts = ref<Shift[]>([])

  onMounted(async () => {
    await loadPersons()
    await loadShifts()
  })

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
    gap: 20px;
    padding: 20px;
    overflow: hidden;
  }

  .left-panel,
  .right-panel {
    flex: 1;
    background: white;
    border-radius: 8px;
    padding: 20px;
    overflow: auto;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }
  </style>