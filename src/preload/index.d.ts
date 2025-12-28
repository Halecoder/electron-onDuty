import { ElectronAPI } from '@electron-toolkit/preload'

interface Person {
  id: number
  name: string
  email: string
  order: number
}

interface Shift {
  id: number
  name: string
  order: number
  mondayPersonIds: string
  fridayPersonIds: string
}

interface Schedule {
  id: number
  weekStart: string
  shiftId: number
  scheduleData: string
}

interface WeekendShift {
  id: number
  name: string
  leaderIds: string
  pioneerIds: string
}

interface BasicData {
  id: number
  baseWeek: string
  weekendRotationIndex_1: number
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

interface API {
  // 人员管理
  getAllPersons: () => Promise<Person[]>
  addPerson: (person: Omit<Person, 'id'>) => Promise<Person>
  updatePerson: (person: Person) => Promise<void>
  deletePerson: (id: number) => Promise<void>

  // 班次管理
  getAllShifts: () => Promise<Shift[]>
  addShift: (shift: Omit<Shift, 'id'>) => Promise<Shift>
  updateShift: (shift: Shift) => Promise<void>
  deleteShift: (id: number) => Promise<void>

  // 排班记录
  getSchedule: (weekStart: string) => Promise<Schedule | undefined>
  saveSchedule: (schedule: Omit<Schedule, 'id'>) => Promise<void>
  getAllSchedules: () => Promise<Schedule[]>

  // 周末班次
  getAllWeekendShifts: () => Promise<WeekendShift[]>
  updateWeekendShift: (shift: WeekendShift) => Promise<void>

  // 基础数据
  getBasicData: () => Promise<BasicData>
  updateBasicData: (data: BasicData) => Promise<void>

  // 清除排班记录
  clearSchedulesByShiftId: (shiftId: number) => Promise<void>
  clearAllSchedules: () => Promise<void>

  // 邮件相关类型
  getEmailConfig: () => Promise<EmailConfig>
  updateEmailConfig: (config: EmailConfig) => Promise<void>
  sendTestEmail: () => Promise<{ success: boolean; error?: string }>
  sendScheduleEmail: (weekStart: string) => Promise<{ success: boolean; error?: string }>
  getCurrentWeek: () => Promise<string>

  // 自启动相关类型
  setAutoStart: (enable: boolean) => Promise<void>
  getAutoStartStatus: () => Promise<boolean>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
