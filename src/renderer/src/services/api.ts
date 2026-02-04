import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

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
  mondayPersonIds: string
  fridayPersonIds: string
}

export interface Schedule {
  id: number
  weekStart: string
  shiftId: number
  scheduleData: string
}

export interface WeekendShift {
  id: number
  name: string
  leaderIds: string
  pioneerIds: string
}

export interface BasicData {
  id: number
  baseWeek: string
  weekendRotationIndex_1: number
  weekendRotationIndex_2: number
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

export const api = {
  // 人员管理
  getAllPersons: async () => (await apiClient.get<Person[]>('/persons')).data,
  addPerson: async (person: Omit<Person, 'id'>) =>
    (await apiClient.post<Person>('/persons', person)).data,
  updatePerson: async (person: Person) => (await apiClient.put('/persons', person)).data,
  deletePerson: async (id: number) => (await apiClient.delete(`/persons/${id}`)).data,

  // 班次管理
  getAllShifts: async () => (await apiClient.get<Shift[]>('/shifts')).data,
  addShift: async (shift: Omit<Shift, 'id'>) =>
    (await apiClient.post<Shift>('/shifts', shift)).data,
  updateShift: async (shift: Shift) => (await apiClient.put('/shifts', shift)).data,
  deleteShift: async (id: number) => (await apiClient.delete(`/shifts/${id}`)).data,

  // 排班记录
  getSchedule: async (weekStart: string) =>
    (await apiClient.get<Schedule | undefined>('/schedules', { params: { weekStart } })).data,
  saveSchedule: async (schedule: Omit<Schedule, 'id'>) =>
    (await apiClient.post('/schedules', schedule)).data,
  getAllSchedules: async () => (await apiClient.get<Schedule[]>('/schedules')).data,
  updateSchedule: async (weekStart: string, scheduleData: string) =>
    (await apiClient.put(`/schedules/${weekStart}`, { scheduleData })).data,
  clearSchedulesByShiftId: async (shiftId: number) =>
    (await apiClient.delete(`/schedules/by-shift/${shiftId}`)).data,
  clearAllSchedules: async () => (await apiClient.delete('/schedules')).data,
  clearSchedulesBeforeWeek: async (beforeWeek: string) =>
    (await apiClient.delete('/schedules', { params: { beforeWeek } })).data,
  clearSchedulesFromWeek: async (fromWeek: string) =>
    (await apiClient.delete('/schedules', { params: { fromWeek } })).data,

  // 周末班次
  getAllWeekendShifts: async () => (await apiClient.get<WeekendShift[]>('/weekend-shifts')).data,
  updateWeekendShift: async (shift: WeekendShift) =>
    (await apiClient.put('/weekend-shifts', shift)).data,

  // 基础数据
  getBasicData: async () => (await apiClient.get<BasicData>('/basic-data')).data,
  updateBasicData: async (data: BasicData) => (await apiClient.put('/basic-data', data)).data,

  // 周末排班
  getWeekendSchedule: async (weekStart: string) =>
    (
      await apiClient.get<{ saturday: string; sunday: string } | null>('/weekend-schedules', {
        params: { weekStart }
      })
    ).data,
  saveWeekendSchedule: async (weekendSchedule: {
    weekStart: string
    saturday: string
    sunday: string
  }) => (await apiClient.post('/weekend-schedules', weekendSchedule)).data,

  // 邮件配置
  getEmailConfig: async () => (await apiClient.get<EmailConfig>('/email-config')).data,
  updateEmailConfig: async (config: EmailConfig) =>
    (await apiClient.put('/email-config', config)).data,

  // 占位符 - Web版暂不支持或需要额外实现
  sendTestEmail: async () => {
    console.warn('Not implemented in Web version')
    return { success: false, error: 'Not implemented' }
  },
  sendScheduleEmail: async (weekStart: string) => {
    console.warn('Not implemented in Web version')
    return { success: false, error: 'Not implemented' }
  },
  getCurrentWeek: async () => {
    console.warn('Not implemented in Web version')
    return ''
  },
  setAutoStart: async (enable: boolean) => {
    console.warn('Auto start not supported in Web')
  },
  getAutoStartStatus: async () => {
    return false
  }
}

// 兼容现有代码的全局挂载
// @ts-ignore
window.api = api
