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
    [personId: number]: boolean  // true 表示该人当天值班
  }

  export interface WeekSchedule {
    monday: DaySchedule
    tuesday: DaySchedule
    wednesday: DaySchedule
    thursday: DaySchedule
    friday: DaySchedule
  }