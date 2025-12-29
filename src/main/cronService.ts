import * as cron from 'node-cron'
import { DatabaseManager } from './database'
import { EmailService } from './emailService'


function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // 周日回到本周一
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return formatLocalDate(d)
}

function formatLocalDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export class CronService {
  private db: DatabaseManager
  private emailService: EmailService
  private currentTask: cron.ScheduledTask | null = null

  constructor(db: DatabaseManager) {
    this.db = db
    this.emailService = new EmailService(db)
  }

  startCronJob(): void {
    this.stopCronJob()

    const config = this.db.getEmailConfig()

    if (config.enabled && config.cronExpression) {
      try {
        this.currentTask = cron.schedule(config.cronExpression, async () => {
          try {
            const weekStart = getWeekStart(new Date())
            await this.emailService.sendScheduleEmail(weekStart)
            console.log('定时邮件发送成功')
          } catch (error) {
            console.error('定时邮件发送失败:', error)
          }
        }, {
          scheduled: true
        })

        console.log('定时任务已启动:', config.cronExpression)
      } catch (error) {
        console.error('启动定时任务失败:', error)
      }
    }
  }

  stopCronJob(): void {
    if (this.currentTask) {
      this.currentTask.stop()
      this.currentTask = null
      console.log('定时任务已停止')
    }
  }

  restartCronJob(): void {
    this.startCronJob()
  }
}