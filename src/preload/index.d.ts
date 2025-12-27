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

interface API {
  getAllPersons: () => Promise<Person[]>
  addPerson: (person: Omit<Person, 'id'>) => Promise<Person>
  updatePerson: (person: Person) => Promise<void>
  deletePerson: (id: number) => Promise<void>

  getAllShifts: () => Promise<Shift[]>
  addShift: (shift: Omit<Shift, 'id'>) => Promise<Shift>
  updateShift: (shift: Shift) => Promise<void>
  deleteShift: (id: number) => Promise<void>

  getSchedule: (weekStart: string) => Promise<Schedule | undefined>
  saveSchedule: (schedule: Omit<Schedule, 'id'>) => Promise<void>
  getAllSchedules: () => Promise<Schedule[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}