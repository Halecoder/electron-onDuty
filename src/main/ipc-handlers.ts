import { ipcMain } from 'electron'
import { getDatabase } from './database'

export function setupIpcHandlers() {
  const db = getDatabase()

  // 人员管理
  ipcMain.handle('get-all-persons', () => {
    return db.getAllPersons()
  })

  ipcMain.handle('add-person', (_, person) => {
    return db.addPerson(person)
  })

  ipcMain.handle('update-person', (_, person) => {
    db.updatePerson(person)
  })

  ipcMain.handle('delete-person', (_, id) => {
    db.deletePerson(id)
  })

  // 班次管理
  ipcMain.handle('get-all-shifts', () => {
    return db.getAllShifts()
  })

  ipcMain.handle('add-shift', (_, shift) => {
    return db.addShift(shift)
  })

  ipcMain.handle('update-shift', (_, shift) => {
    db.updateShift(shift)
  })

  ipcMain.handle('delete-shift', (_, id) => {
    db.deleteShift(id)
  })

  // 排班记录
  ipcMain.handle('get-schedule', (_, weekStart) => {
    return db.getSchedule(weekStart)
  })

  ipcMain.handle('save-schedule', (_, schedule) => {
    db.saveSchedule(schedule)
  })

  ipcMain.handle('get-all-schedules', () => {
    return db.getAllSchedules()
  })

  ipcMain.handle('clear-schedules-by-shift-id', (_, shiftId) => {
    db.clearSchedulesByShiftId(shiftId)
  })

  ipcMain.handle('clear-all-schedules', () => {
    db.clearAllSchedules()
  })
}