import nodemailer from 'nodemailer'
import { DatabaseManager, EmailConfig, Person } from './database'
import { WeekendSchedule } from './types'

export class EmailService {
  private db: DatabaseManager
  private transporter: nodemailer.Transporter | null = null

  constructor(db: DatabaseManager) {
    this.db = db
  }

  async initializeTransporter(config: EmailConfig): Promise<void> {
    this.transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: false,
      auth: {
        user: `${config.smtpUser}${config.emailSuffix}`,
        pass: config.smtpPass
      },
      tls: { rejectUnauthorized: false } //解决 unable to verify the first certificate
    })

    await this.transporter.verify()
  }

  async sendTestEmail(): Promise<void> {
    const config = this.db.getEmailConfig() // Get config from database
    await this.initializeTransporter(config)

    const mailOptions = {
      from: `${config.smtpUser}${config.emailSuffix}`,
      to: `${config.smtpUser}${config.emailSuffix}`,
      subject: '排班系统 - 邮件配置测试',
      html: '<p>这是一封测试邮件，用于验证邮件配置是否正确。</p>'
    }

    await this.transporter?.sendMail(mailOptions)
  }

  async sendScheduleEmail(weekStart: string): Promise<void> {
    const config = this.db.getEmailConfig()

    // if (!config.enabled || !config.smtpHost) {
    //   throw new Error('邮件配置未启用或不完整')
    // }

    await this.initializeTransporter(config)

    const persons = this.db.getAllPersons()
    const schedule = this.db.getSchedule(weekStart)

    if (!schedule) {
      throw new Error('未找到排班数据')
    }

    const scheduleData = JSON.parse(schedule.scheduleData)
    const weekendShift = this.db.getAllWeekendShifts()[0]
    const basicData = this.db.getBasicData()

    // 修改：优先使用手动保存的周末排班数据
    let weekendSchedule
    const savedWeekendSchedule = this.db.getWeekendSchedule(weekStart)

    if (savedWeekendSchedule) {
      // 使用手动保存的数据
      weekendSchedule = {
        saturday: JSON.parse(savedWeekendSchedule.saturday),
        sunday: JSON.parse(savedWeekendSchedule.sunday)
      }
    } else {
      // 没有手动保存的数据，使用自动生成的
      weekendSchedule = this.generateWeekendSchedule(persons, weekendShift, basicData, weekStart)
    }

    const emailContent = this.generateEmailContent(
      persons,
      scheduleData,
      weekendSchedule,
      weekStart
    )

    const toEmails = persons.map((p) => `${p.email}${config.emailSuffix}`).join(', ')
    // const toEmails = '602111@gree.com.cn'
    const ccEmails = config.ccEmails
      ? config.ccEmails
          .split(',')
          .map((email) => email.trim())
          .join(', ')
      : ''

    await this.transporter?.sendMail({
      from: `${config.smtpUser}${config.emailSuffix}`,
      to: toEmails,
      cc: `${ccEmails}${config.emailSuffix}`,
      subject: `${weekStart} 值班安排表`,
      html: emailContent
    })
  }

  private generateEmailContent(
    persons: Person[],
    weekdaySchedule: any,
    weekendSchedule: WeekendSchedule,
    weekStart: string
  ): string {
    const weekDays = ['周一', '周二', '周三', '周四', '周五']
    const scheduleKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const

    let tableHtml = `
      <h2>${weekStart} 值班安排表</h2>
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th style="padding: 8px; background: #f5f5f5;">姓名</th>
            <th style="padding: 8px; background: #f5f5f5;">邮箱</th>
            ${weekDays.map((day) => `<th style="padding: 8px; background: #f5f5f5;">${day}</th>`).join('')}
            <th style="padding: 8px; background: #fdf6ec;">周六</th>
            <th style="padding: 8px; background: #fdf6ec;">周日</th>
          </tr>
        </thead>
        <tbody>
    `

    persons.forEach((person) => {
      const row = [
        `<td style="padding: 8px;">${person.name}</td>`,
        `<td style="padding: 8px;">${person.email}</td>`
      ]

      scheduleKeys.forEach((key) => {
        const isOnDuty = weekdaySchedule[key][person.id]
        row.push(
          `<td style="padding: 8px; background: ${isOnDuty ? '#67c23a' : 'transparent'}; color: ${isOnDuty ? 'white' : 'black'};">${isOnDuty ? '✓' : ''}</td>`
        )
      })

      const saturdayDuty = weekendSchedule.saturday.includes(person.id)
      const sundayDuty = weekendSchedule.sunday.includes(person.id)

      row.push(
        `<td style="padding: 8px; background: ${saturdayDuty ? '#e6a23c' : 'transparent'}; color: ${saturdayDuty ? 'white' : 'black'};">${saturdayDuty ? '✓' : ''}</td>`
      )
      row.push(
        `<td style="padding: 8px; background: ${sundayDuty ? '#e6a23c' : 'transparent'}; color: ${sundayDuty ? 'white' : 'black'};">${sundayDuty ? '✓' : ''}</td>`
      )

      tableHtml += `<tr>${row.join('')}</tr>`
    })

    tableHtml += '</tbody></table>'

    return `
      <div style="font-family: Arial, sans-serif;">
        ${tableHtml}
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          此邮件由排班系统自动发送，请勿回复。
        </p>
      </div>
    `
  }

  // private generateWeekendSchedule(
  //   persons: Person[],
  //   weekendShift: any,
  //   basicData: any,
  //   weekStart: string
  // ): WeekendSchedule {
  //   // Import your existing schedule generation logic
  //   return generateWeekendSchedule(persons, weekendShift, basicData, weekStart)
  // }

  private getWeekendRotationList(persons: Person[], weekendShift: any): Person[] {
    const rotation: Person[] = []

    const leaderIds = weekendShift.leaderIds
    const pioneerIds = weekendShift.pioneerIds

    const leaders = leaderIds
      .map((id) => persons.find((p) => p.id === id))
      .filter((p): p is Person => !!p)

    const pioneers = pioneerIds
      .map((id) => persons.find((p) => p.id === id))
      .filter((p): p is Person => !!p)

    const pioneerQueue = [...pioneers]
    const pendingSecondRound: Person[] = []

    for (let i = 0; i < leaders.length; i++) {
      const leader = leaders[i]
      rotation.push(leader)

      const secondPioneer = pendingSecondRound.shift()
      if (secondPioneer) {
        rotation.push(secondPioneer)
      }

      const newPioneer = pioneerQueue.shift()
      if (newPioneer) {
        rotation.push(newPioneer)
        pendingSecondRound.push(newPioneer)
      }
    }

    for (const pioneer of pendingSecondRound) {
      rotation.push(pioneer)
    }

    return rotation
  }

  private getRegularPersons(persons: Person[], weekendShift: any): Person[] {
    if (!weekendShift) return persons

    // Parse JSON strings to arrays first
    const leaderIds = new Set(weekendShift.leaderIds)
    const pioneerIds = new Set(weekendShift.pioneerIds)
    const excludedIds = new Set([...leaderIds, ...pioneerIds])

    return persons.filter((person) => !excludedIds.has(person.id))
  }

  private generateWeekendSchedule(
    persons: Person[],
    weekendShift: any,
    basicData: any,
    weekStart: string
  ): WeekendSchedule {
    const schedule: WeekendSchedule = {
      saturday: [],
      sunday: []
    }

    if (!weekendShift || !basicData) {
      return schedule
    }

    // Parse JSON strings to arrays
    const parsedWeekendShift = {
      ...weekendShift,
      leaderIds: JSON.parse(weekendShift.leaderIds || '[]'),
      pioneerIds: JSON.parse(weekendShift.pioneerIds || '[]')
    }

    const rotationList = this.getWeekendRotationList(persons, parsedWeekendShift)

    if (rotationList.length === 0) {
      return schedule
    }

    const baseDate = new Date(basicData.baseWeek)
    const currentDate = new Date(weekStart)
    const weeksDiff = Math.floor(
      (currentDate.getTime() - baseDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    )

    // Fixed: Add rotation index offset for Saturday
    const rotationIndex = (basicData.weekendRotationIndex_1 + weeksDiff) % rotationList.length

    if (rotationList[rotationIndex]) {
      schedule.saturday = [rotationList[rotationIndex].id]
    }

    const regularPersons = this.getRegularPersons(persons, parsedWeekendShift)
    if (regularPersons.length > 0) {
      // Fixed: Use correct property name for Sunday
      const sundayIndex = (basicData.weekendRotationIndex_2 + weeksDiff) % regularPersons.length
      if (regularPersons[sundayIndex]) {
        schedule.sunday = [regularPersons[sundayIndex].id]
      }
    }

    return schedule
  }
}
