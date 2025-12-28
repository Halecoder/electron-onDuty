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
  mondayPersonIds: number[]
  fridayPersonIds: number[]
}

export interface DaySchedule {
  [personId: number]: boolean // true 表示该人当天值班
}

export interface WeekSchedule {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
}

export interface WeekendShift {
  id: number
  name: string
  leaderIds: number[]
  pioneerIds: number[]
}

export interface BasicData {
  id: number
  baseWeek: string
  weekendRotationIndex_1: number,
  weekendRotationIndex_2: number
}

export interface WeekendSchedule {
  saturday: number[] // 值班人员ID数组
  sunday: number[] // 周日值班人员ID数组
}