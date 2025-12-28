import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // 现有人员管理 API
  getAllPersons: () => ipcRenderer.invoke('get-all-persons'),
  addPerson: (person) => ipcRenderer.invoke('add-person', person),
  updatePerson: (person) => ipcRenderer.invoke('update-person', person),
  deletePerson: (id) => ipcRenderer.invoke('delete-person', id),

  // 现有班次管理 API
  getAllShifts: () => ipcRenderer.invoke('get-all-shifts'),
  addShift: (shift) => ipcRenderer.invoke('add-shift', shift),
  updateShift: (shift) => ipcRenderer.invoke('update-shift', shift),
  deleteShift: (id) => ipcRenderer.invoke('delete-shift', id),

  // 现有排班记录 API
  getSchedule: (weekStart) => ipcRenderer.invoke('get-schedule', weekStart),
  saveSchedule: (schedule) => ipcRenderer.invoke('save-schedule', schedule),
  getAllSchedules: () => ipcRenderer.invoke('get-all-schedules'),

  // 新增周末班次 API
  getAllWeekendShifts: () => ipcRenderer.invoke('get-all-weekend-shifts'),
  updateWeekendShift: (shift) => ipcRenderer.invoke('update-weekend-shift', shift),

  // 新增基础数据 API
  getBasicData: () => ipcRenderer.invoke('get-basic-data'),
  updateBasicData: (data) => ipcRenderer.invoke('update-basic-data', data),

  // 清除排班记录 API
  clearSchedulesByShiftId: (shiftId) => ipcRenderer.invoke('clear-schedules-by-shift-id', shiftId),
  clearAllSchedules: () => ipcRenderer.invoke('clear-all-schedules'),

  // 邮件相关 API
  getEmailConfig: () => ipcRenderer.invoke('get-email-config'),
  updateEmailConfig: (config) => ipcRenderer.invoke('update-email-config', config),
  sendTestEmail: () => ipcRenderer.invoke('send-test-email'),
  sendScheduleEmail: (weekStart) => ipcRenderer.invoke('send-schedule-email', weekStart),
  getCurrentWeek: () => ipcRenderer.invoke('get-current-week'),

  // 自启动相关 API
  setAutoStart: (enable) => ipcRenderer.invoke('set-auto-start', enable),
  getAutoStartStatus: () => ipcRenderer.invoke('get-auto-start-status')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}