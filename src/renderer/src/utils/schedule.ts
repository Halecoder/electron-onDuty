import { Person, Shift, WeekSchedule, WeekendShift, BasicData, WeekendSchedule } from '../types'

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

function formatLocalDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // 周日回到本周一
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return formatLocalDate(d)
}

export function getNextWeekStart(weekStart: string): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 7)
  return formatLocalDate(d)
}

export function getPreviousWeekStart(weekStart: string): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() - 7)
  return formatLocalDate(d)
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export function getWeekDates(weekStart: string): string[] {
  const dates: string[] = []
  const d = new Date(weekStart)

  for (let i = 0; i < 5; i++) {
    dates.push(formatLocalDate(d))
    d.setDate(d.getDate() + 1)
  }

  return dates
}


// 新增周末排班算法
export function generateWeekendSchedule(
  persons: Person[],
  weekendShift: WeekendShift,
  basicData: BasicData,
  weekStart: string
): WeekendSchedule {
  const schedule: WeekendSchedule = {
    saturday: []
  }

  if (!weekendShift || weekendShift.leaderIds.length === 0) {
    return schedule
  }

  // 计算从基准周开始的周数
  const baseDate = new Date(basicData.baseWeek)
  const currentDate = new Date(weekStart)
  const weeksDiff = Math.floor((currentDate.getTime() - baseDate.getTime()) / (7 * 24 * 60 * 60 * 1000))

  // 获取轮换人员列表
  const rotationList = getWeekendRotationList(persons, weekendShift)

  if (rotationList.length === 0) {
    return schedule
  }

  // 计算当前周应该值班的人员
  const rotationIndex = (basicData.weekendRotationIndex + weeksDiff) % rotationList.length
  const dutyPerson = rotationList[rotationIndex]

  if (dutyPerson) {
    schedule.saturday = [dutyPerson.id]
  }

  return schedule
}

function getWeekendRotationList(persons: Person[], weekendShift: WeekendShift): Person[] {
  const rotation: Person[] = []

  const leaders = weekendShift.leaderIds
    .map(id => persons.find(p => p.id === id))
    .filter((p): p is Person => !!p)

  const pioneers = weekendShift.pioneerIds
    .map(id => persons.find(p => p.id === id))
    .filter((p): p is Person => !!p)

  const pioneerQueue = [...pioneers]
  const pendingSecondRound: Person[] = []

  for (let i = 0; i < leaders.length; i++) {
    const leader = leaders[i]
    rotation.push(leader)

    // 插入上一个先锋的第二次出现
    const secondPioneer = pendingSecondRound.shift()
    if (secondPioneer) {
      rotation.push(secondPioneer)
    }

    // 插入新的先锋的第一次出现
    const newPioneer = pioneerQueue.shift()
    if (newPioneer) {
      rotation.push(newPioneer)
      pendingSecondRound.push(newPioneer)
    }
  }

  // 如果还有未插入第二次的先锋，继续插入
  for (const pioneer of pendingSecondRound) {
    rotation.push(pioneer)
  }

  return rotation
}


// 获取周六日期
export function getSaturdayDate(weekStart: string): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 5) // 周一 + 5天 = 周六
  return d.toISOString().split('T')[0]
}