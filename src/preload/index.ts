import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // 人员管理
  getAllPersons: () => ipcRenderer.invoke('get-all-persons'),
  addPerson: (person) => ipcRenderer.invoke('add-person', person),
  updatePerson: (person) => ipcRenderer.invoke('update-person', person),
  deletePerson: (id) => ipcRenderer.invoke('delete-person', id),

  // 班次管理
  getAllShifts: () => ipcRenderer.invoke('get-all-shifts'),
  addShift: (shift) => ipcRenderer.invoke('add-shift', shift),
  updateShift: (shift) => ipcRenderer.invoke('update-shift', shift),
  deleteShift: (id) => ipcRenderer.invoke('delete-shift', id),

  // 排班记录
  getSchedule: (weekStart) => ipcRenderer.invoke('get-schedule', weekStart),
  saveSchedule: (schedule) => ipcRenderer.invoke('save-schedule', schedule),
  getAllSchedules: () => ipcRenderer.invoke('get-all-schedules'),

  clearSchedulesByShiftId: (shiftId: number) => ipcRenderer.invoke('clear-schedules-by-shift-id', shiftId),
  clearAllSchedules: () => ipcRenderer.invoke('clear-all-schedules')
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