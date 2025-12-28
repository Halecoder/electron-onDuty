import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'

export interface Person {
  id: number
  name: string
  email: string
  order: number
}

export interface Shift {
  id: number
  name: string
  order: number
  mondayPersonIds: string // JSON 数组
  fridayPersonIds: string // JSON 数组
}

export interface Schedule {
  id: number
  weekStart: string // 周一日期 YYYY-MM-DD
  shiftId: number
  scheduleData: string // JSON 对象
}

export interface WeekendShift {
  id: number
  name: string
  leaderIds: string // JSON 数组 - 组长人员ID
  pioneerIds: string // JSON 数组 - 加班先锋人员ID
}

export interface BasicData {
  id: number
  baseWeek: string // 基准周 YYYY-MM-DD
  weekendRotationIndex_1: number // 周末轮换索引1
  weekendRotationIndex_2: number // 周末轮换索引2
}

export interface EmailConfig {
  id: number
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpUser: string
  smtpPass: string
  emailSuffix: string
  cronExpression: string
  enabled: boolean
  ccEmails: string
}

export class DatabaseManager {
  private db: Database.Database

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'onduty.db')
    this.db = new Database(dbPath)
    this.initTables()
    this.initDefaultData() // 添加默认数据初始化
  }

  private initDefaultData() {
    // 初始化默认周末班次
    const existingWeekendShifts = this.db
      .prepare('SELECT COUNT(*) as count FROM weekend_shifts')
      .get() as { count: number }
    if (existingWeekendShifts.count === 0) {
      this.db
        .prepare('INSERT INTO weekend_shifts (name, leaderIds, pioneerIds) VALUES (?, ?, ?)')
        .run('周末班次', '[]', '[]')
    }
  }

  private initTables() {
    // 创建人员表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS persons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        \`order\` INTEGER NOT NULL
      )
    `)

    // 创建班次表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS shifts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        \`order\` INTEGER NOT NULL,
        mondayPersonIds TEXT NOT NULL,
        fridayPersonIds TEXT NOT NULL
      )
    `)

    // 创建排班记录表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weekStart TEXT NOT NULL UNIQUE,
        shiftId INTEGER NOT NULL,
        scheduleData TEXT NOT NULL
      )
    `)

    // 创建周末班次表
    this.db.exec(`
  CREATE TABLE IF NOT EXISTS weekend_shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    leaderIds TEXT NOT NULL,
    pioneerIds TEXT NOT NULL
  )
  `)

  // 更新基础数据表
  this.db.exec(`
  CREATE TABLE IF NOT EXISTS basic_data (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    baseWeek TEXT NOT NULL,
    weekendRotationIndex_1 INTEGER NOT NULL DEFAULT 0,
    weekendRotationIndex_2 INTEGER NOT NULL DEFAULT 0
  )
  `)

   // 创建邮件配置表
   this.db.exec(`
   CREATE TABLE IF NOT EXISTS email_config (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     smtpHost TEXT NOT NULL,
     smtpPort INTEGER NOT NULL,
     smtpSecure INTEGER NOT NULL DEFAULT 0,
     smtpUser TEXT NOT NULL,
     smtpPass TEXT NOT NULL,
     emailSuffix TEXT NOT NULL,
     cronExpression TEXT NOT NULL DEFAULT '0 14 * * 1',
     enabled INTEGER NOT NULL DEFAULT 0,
     ccEmails TEXT NOT NULL DEFAULT ''
   )
 `)

  // 更新初始化数据
  const existingData = this.db.prepare('SELECT COUNT(*) as count FROM basic_data').get() as { count: number }
  if (existingData.count === 0) {
    this.db.prepare('INSERT INTO basic_data (id, baseWeek, weekendRotationIndex_1, weekendRotationIndex_2) VALUES (1, ?, 0, 0)').run('2024-01-01')
  }

  const existingConfig = this.db.prepare('SELECT COUNT(*) as count FROM email_config').get() as { count: number }
  if (existingConfig.count === 0) {
    this.db.prepare(`
      INSERT INTO email_config (id, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, emailSuffix, cronExpression, enabled, ccEmails)
      VALUES (1, '', 587, 0, '', '', '@company.com', '0 14 * * 1', 0, '')
    `).run()
  }
}

  // 人员管理
  getAllPersons(): Person[] {
    return this.db.prepare('SELECT * FROM persons ORDER BY `order`').all() as Person[]
  }

  addPerson(person: Omit<Person, 'id'>): Person {
    const result = this.db
      .prepare('INSERT INTO persons (name, email, `order`) VALUES (?, ?, ?)')
      .run(person.name, person.email, person.order)
    return { id: result.lastInsertRowid as number, ...person }
  }

  updatePerson(person: Person): void {
    this.db
      .prepare('UPDATE persons SET name = ?, email = ?, `order` = ? WHERE id = ?')
      .run(person.name, person.email, person.order, person.id)
  }

  deletePerson(id: number): void {
    this.db.prepare('DELETE FROM persons WHERE id = ?').run(id)
  }

  // 班次管理
  getAllShifts(): Shift[] {
    return this.db.prepare('SELECT * FROM shifts ORDER BY `order`').all() as Shift[]
  }

  addShift(shift: Omit<Shift, 'id'>): Shift {
    const result = this.db
      .prepare(
        'INSERT INTO shifts (name, `order`, mondayPersonIds, fridayPersonIds) VALUES (?, ?, ?, ?)'
      )
      .run(shift.name, shift.order, shift.mondayPersonIds, shift.fridayPersonIds)
    return { id: result.lastInsertRowid as number, ...shift }
  }

  updateShift(shift: Shift): void {
    this.db
      .prepare(
        'UPDATE shifts SET name = ?, `order` = ?, mondayPersonIds = ?, fridayPersonIds = ? WHERE id = ?'
      )
      .run(shift.name, shift.order, shift.mondayPersonIds, shift.fridayPersonIds, shift.id)
  }

  deleteShift(id: number): void {
    this.db.prepare('DELETE FROM shifts WHERE id = ?').run(id)
  }

  // 周末班次管理
  getAllWeekendShifts(): WeekendShift[] {
    return this.db.prepare('SELECT * FROM weekend_shifts').all() as WeekendShift[]
  }

  updateWeekendShift(shift: WeekendShift): void {
    this.db
      .prepare('UPDATE weekend_shifts SET name = ?, leaderIds = ?, pioneerIds = ? WHERE id = ?')
      .run(shift.name, shift.leaderIds, shift.pioneerIds, shift.id)
  }

  // 基础数据管理
  getBasicData(): BasicData {
    return this.db.prepare('SELECT * FROM basic_data WHERE id = 1').get() as BasicData
  }

  updateBasicData(data: BasicData): void {
    this.db
      .prepare('UPDATE basic_data SET baseWeek = ?, weekendRotationIndex_1 = ?, weekendRotationIndex_2 = ? WHERE id = 1')
      .run(data.baseWeek, data.weekendRotationIndex_1, data.weekendRotationIndex_2)
  }

  // 排班记录管理
  getSchedule(weekStart: string): Schedule | undefined {
    return this.db.prepare('SELECT * FROM schedules WHERE weekStart = ?').get(weekStart) as
      | Schedule
      | undefined
  }

  saveSchedule(schedule: Omit<Schedule, 'id'>): void {
    this.db
      .prepare(
        'INSERT OR REPLACE INTO schedules (weekStart, shiftId, scheduleData) VALUES (?, ?, ?)'
      )
      .run(schedule.weekStart, schedule.shiftId, schedule.scheduleData)
  }

  getAllSchedules(): Schedule[] {
    return this.db.prepare('SELECT * FROM schedules ORDER BY weekStart DESC').all() as Schedule[]
  }

  clearSchedulesByShiftId(shiftId: number): void {
    this.db.prepare('DELETE FROM schedules WHERE shiftId = ?').run(shiftId)
  }

  clearAllSchedules(): void {
    this.db.prepare('DELETE FROM schedules').run()
  }

  close() {
    this.db.close()
  }

  getEmailConfig(): EmailConfig {
    return this.db.prepare('SELECT * FROM email_config WHERE id = 1').get() as EmailConfig
  }

  updateEmailConfig(config: EmailConfig): void {
    this.db.prepare(`
      UPDATE email_config SET
      smtpHost = ?, smtpPort = ?, smtpSecure = ?, smtpUser = ?,
      smtpPass = ?, emailSuffix = ?, cronExpression = ?,
      enabled = ?, ccEmails = ? WHERE id = 1
    `).run(
      config.smtpHost, config.smtpPort, config.smtpSecure ? 1 : 0,
      config.smtpUser, config.smtpPass, config.emailSuffix,
      config.cronExpression, config.enabled ? 1 : 0, config.ccEmails
    )
  }
}

let dbInstance: DatabaseManager | null = null

export function getDatabase(): DatabaseManager {
  if (!dbInstance) {
    dbInstance = new DatabaseManager()
  }
  return dbInstance
}

export function closeDatabase() {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}
