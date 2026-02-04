<template>
    <div class="autostart-manager">
      <div class="panel-header">
        <h3>开机自启动</h3>
      </div>

      <el-card>
        <div class="autostart-content">
          <div class="description">
            <p>启用开机自启动后，排班系统将在电脑开机时自动运行。</p>
            <p>当前状态：<strong>{{ autoStartEnabled ? '已启用' : '已禁用' }}</strong></p>
          </div>

          <el-switch
            v-model="autoStartEnabled"
            @change="handleAutoStartChange"
            active-text="启用自启动"
            inactive-text="禁用自启动"
          />
        </div>
      </el-card>
    </div>
  </template>

  <script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'

  const autoStartEnabled = ref(false)

  onMounted(async () => {
    await loadStatus()
  })

  async function loadStatus() {
    try {
      autoStartEnabled.value = await window.api.getAutoStartStatus()
    } catch (error) {
      console.error('获取自启动状态失败:', error)
    }
  }

  async function handleAutoStartChange(value: boolean) {
    try {
      await window.api.setAutoStart(value)
      ElMessage.success(value ? '开机自启动已启用' : '开机自启动已禁用')
    } catch (error) {
      ElMessage.error('设置失败')
      // 恢复原状态
      autoStartEnabled.value = !value
    }
  }
  </script>

  <style scoped>
  .autostart-manager {
    height: 100%;
    display: flex;
    flex-direction: column;
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

  .autostart-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }

  .description p {
    margin: 5px 0;
    color: #666;
  }
  </style>