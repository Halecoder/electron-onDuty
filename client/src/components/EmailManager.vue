<template>
  <div class="email-manager">
    <div class="panel-header">
      <h3>邮件配置</h3>
    </div>

    <el-form :model="form" label-width="120px">
      <el-card class="config-card">
        <template #header>
          <span>SMTP 服务器配置</span>
        </template>

        <el-form-item label="SMTP 服务器" required>
          <el-input v-model="form.smtpHost" placeholder="smtp.example.com" />
        </el-form-item>

        <el-form-item label="SMTP 端口" required>
          <el-input-number v-model="form.smtpPort" :min="1" :max="65535" />
        </el-form-item>

        <el-form-item label="启用 SSL">
          <el-switch v-model="form.smtpSecure"  />
        </el-form-item>

        <el-form-item label="发送邮箱" required>
          <el-input v-model="form.smtpUser" placeholder="sender@example.com" />
        </el-form-item>

        <el-form-item label="邮箱密码" required>
          <el-input v-model="form.smtpPass" type="password" show-password />
        </el-form-item>

        <el-form-item label="邮件后缀" required>
          <el-input v-model="form.emailSuffix" placeholder="@company.com" />
        </el-form-item>
      </el-card>

      <el-card class="config-card">
        <template #header>
          <span>定时发送配置</span>
        </template>

        <el-form-item label="启用定时发送">
          <el-switch v-model="form.enabled" />
        </el-form-item>

        <el-form-item label="Cron 表达式" required>
          <el-input
            v-model="form.cronExpression"
            placeholder="0 14 * * 1"
            :disabled="!form.enabled"
          />
          <div class="form-tip">默认: 每周一 14:00 (0 14 * * 1)</div>
        </el-form-item>

        <el-form-item label="抄送邮箱">
          <el-input
            v-model="form.ccEmails"
            placeholder="123456,654321 (用逗号分隔的6位数字)"
          />
          <div class="form-tip">多个抄送邮箱用逗号分隔，仅支持6位数字</div>
        </el-form-item>
      </el-card>

      <div class="action-buttons">
        <el-button type="primary" @click="saveConfig">保存配置</el-button>
        <el-button @click="sendTestEmail">发送测试邮件</el-button>
        <el-button type="success" @click="sendScheduleEmail">立即发送排班表</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits<{
  refresh: []
}>()

const form = reactive({
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: '',
  smtpPass: '',
  emailSuffix: '@company.com',
  cronExpression: '0 14 * * 1',
  enabled: false,
  ccEmails: ''
})

onMounted(async () => {
  await loadConfig()
})

async function loadConfig() {
  try {
    const config = await window.api.getEmailConfig()
    Object.assign(form, {
      ...config,
      smtpSecure: Boolean(config.smtpSecure),
      enabled: Boolean(config.enabled)
    })
  } catch (error) {
    ElMessage.error('加载配置失败')
  }
}

async function saveConfig() {
  try {
    const plainConfig = {
      ...form,
      smtpSecure: form.smtpSecure ? 1 : 0,
      enabled: form.enabled ? 1 : 0
    }
    await window.api.updateEmailConfig(plainConfig)
    ElMessage.success('配置保存成功')
    emit('refresh')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

async function sendTestEmail() {
  try {
    const result = await window.api.sendTestEmail()
    if (result.success) {
      ElMessage.success('测试邮件发送成功')
    } else {
      ElMessage.error(`发送失败: ${result.error}`)
    }
  } catch (error) {
    ElMessage.error('发送测试邮件失败')
  }
}

async function sendScheduleEmail() {
  try {
    const currentWeek = await window.api.getCurrentWeek()
    const result = await window.api.sendScheduleEmail(currentWeek)
    if (result.success) {
      ElMessage.success('排班表邮件发送成功')
    } else {
      ElMessage.error(`发送失败: ${result.error}`)
    }
  } catch (error) {
    ElMessage.error('发送排班表邮件失败')
  }
}
</script>

<style scoped>
.email-manager {
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

.config-card {
  margin-bottom: 20px;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  margin-bottom: 20px;
}
</style>