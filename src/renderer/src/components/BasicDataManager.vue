<template>
    <div class="basic-data-manager">
      <div class="panel-header">
        <h3>基础数据配置</h3>
      </div>

      <el-card class="basic-card">
        <template #header>
          <div class="card-header">
            <span>系统基础配置</span>
          </div>
        </template>

        <el-form :model="form" label-width="120px">
          <el-form-item label="基准周">
            <el-date-picker
              v-model="form.baseWeek"
              type="date"
              placeholder="选择基准周"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :disabled-date="disabledDate"
            />
            <div class="form-tip">用于计算班次轮换的基准日期，建议设置为某个周一</div>
          </el-form-item>

          <el-form-item label="周末轮换索引">
            <el-input-number
              v-model="form.weekendRotationIndex"
              :min="0"
              :max="999"
              controls-position="right"
            />
            <div class="form-tip">周末值班轮换的当前位置，修改后会影响后续排班</div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="saveBasicData">保存配置</el-button>
            <el-button @click="resetRotationIndex">重置轮换索引</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- <el-card class="stats-card">
        <template #header>
          <span>系统统计</span>
        </template>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">总人员数</div>
            <div class="stat-value">{{ stats.totalPersons }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">组长人数</div>
            <div class="stat-text">{{ stats.totalLeaders }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">加班先锋人数</div>
            <div class="stat-text">{{ stats.totalPioneers }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">班次数量</div>
            <div class="stat-value">{{ stats.totalShifts }}</div>
          </div>
        </div>
      </el-card> -->
    </div>
  </template>

  <script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { BasicData, Person, Shift, WeekendShift } from '../types'

  const props = defineProps<{
    basicData: BasicData | null
    persons: Person[]
    shifts: Shift[]
    weekendShift: WeekendShift | null
  }>()

  const emit = defineEmits<{
    refresh: []
  }>()

  const form = reactive({
    baseWeek: '',
    weekendRotationIndex: 0
  })

//   const stats = computed(() => ({
//   totalPersons: props.persons.length,
//   totalLeaders: props.weekendShift?.leaderIds?.length || 0,
//   totalPioneers: props.weekendShift?.pioneerIds?.length || 0,
//   totalShifts: props.shifts.length
// }))

  onMounted(() => {
    if (props.basicData) {
      form.baseWeek = props.basicData.baseWeek
      form.weekendRotationIndex = props.basicData.weekendRotationIndex
    }
  })

  function disabledDate(time: Date) {
    // 只能选择周一的日期
    return time.getDay() !== 1
  }

  async function saveBasicData() {
    if (!form.baseWeek) {
      ElMessage.warning('请选择基准周')
      return
    }

    try {
      await window.api.updateBasicData({
        id: 1,
        baseWeek: form.baseWeek,
        weekendRotationIndex: form.weekendRotationIndex
      })

      ElMessage.success('保存成功')
      emit('refresh')
    } catch (error) {
      ElMessage.error('保存失败')
    }
  }

  async function resetRotationIndex() {
    try {
      await ElMessageBox.confirm('确定要重置轮换索引吗？这将影响周末排班顺序。', '提示', {
        type: 'warning'
      })

      form.weekendRotationIndex = 0
      await saveBasicData()
    } catch (error) {
      // 用户取消
    }
  }
  </script>

  <style scoped>
  .basic-data-manager {
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
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

  .basic-card,
  .stats-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .form-tip {
    font-size: 12px;
    color: #999;
    margin-top: 5px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
  }

  .stat-item {
    text-align: center;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .stat-label {
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #409eff;
  }

  .stat-text {
    font-size: 18px;
    font-weight: bold;
    color: #409eff;
  }
  </style>