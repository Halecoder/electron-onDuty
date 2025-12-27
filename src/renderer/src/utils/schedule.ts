import { Person, Shift, WeekSchedule } from '../types'

export function generateSchedule(
  persons: Person[],
  shift: Shift
): WeekSchedule {
  const schedule: WeekSchedule = {
    monday: {},
    tuesday: {},
    wednesday: {},
    thursday: {},
    friday: {}
  }

  const allPersonIds = persons.map(p => p.id)

  // 周一：配置的周一人员
  shift.mondayPersonIds.forEach(id => {
    schedule.monday[id] = true
  })

  // 周五：配置的周五人员
  shift.fridayPersonIds.forEach(id => {
    schedule.friday[id] = true
  })

  // 周三：周一和周五的人员合并
  const wednesdayPersons = [...new Set([...shift.mondayPersonIds, ...shift.fridayPersonIds])]
  wednesdayPersons.forEach(id => {
    schedule.wednesday[id] = true
  })

  // 周二、周四：剩余的人员
  const scheduledPersons = new Set(wednesdayPersons)
  const remainingPersons = allPersonIds.filter(id => !scheduledPersons.has(id))

  remainingPersons.forEach(id => {
    schedule.tuesday[id] = true
    schedule.thursday[id] = true
  })

  return schedule
}

export function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // 调整到周一
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

export function getNextWeekStart(weekStart: string): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

export function getPreviousWeekStart(weekStart: string): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() - 7)
  return d.toISOString().split('T')[0]
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export function getWeekDates(weekStart: string): string[] {
  const dates: string[] = []
  const d = new Date(weekStart)

  for (let i = 0; i < 5; i++) {
    dates.push(d.toISOString().split('T')[0])
    d.setDate(d.getDate() + 1)
  }

  return dates
}