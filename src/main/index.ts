import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { setupIpcHandlers } from './ipc-handlers'
import { closeDatabase } from './database'
import { DatabaseManager, getDatabase } from './database'
import { CronService } from './cronService'
import { EmailService } from './emailService'
import AutoLaunch from 'auto-launch'


let db: DatabaseManager
let cronService: CronService
let autoLauncher: AutoLaunch

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // 周日回到本周一
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return formatLocalDate(d)
}

function formatLocalDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function setAutoStart(enable: boolean): void {
  if (enable) {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true
    })
    console.log('开机自启动已启用')
  } else {
    app.setLoginItemSettings({
      openAtLogin: false
    })
    console.log('开机自启动已禁用')
  }
}

function getAutoStartStatus(): boolean {
  const loginItemSettings = app.getLoginItemSettings()
  return loginItemSettings.openAtLogin || false
}

function initializeAutoLauncher(): void {
  autoLauncher = new AutoLaunch({
    name: '排班系统',
    path: app.getPath('exe')
  })
}
function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

   // Initialize database and services
   db = new DatabaseManager()
   cronService = new CronService(db)
   initializeAutoLauncher()

   // Start cron job
   cronService.startCronJob()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('get-email-config', () => {
    return db.getEmailConfig()
  })

  ipcMain.handle('update-email-config', (_, config) => {
    db.updateEmailConfig(config)
  })

  ipcMain.handle('send-test-email', async () => {
    try {
      const emailService = new EmailService(db)
      await emailService.sendTestEmail()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('get-current-week', () => {
  const today = new Date()
  const currentWeekStart = getWeekStart(today)
  return currentWeekStart
  })

  ipcMain.handle('send-schedule-email', async (_, weekStart) => {
    try {
      const emailService = new EmailService(db) // Updated: pass db instead of config
      await emailService.sendScheduleEmail(weekStart) // Updated: method signature changed
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  // Auto-startup handlers
  ipcMain.handle('set-auto-start', (_, enable) => {
    setAutoStart(enable)
  })

  ipcMain.handle('get-auto-start-status', () => {
    return getAutoStartStatus()
  })

  setupIpcHandlers()
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

app.on('before-quit', () => {
  closeDatabase()
})