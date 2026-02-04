import express from 'express'
import cors from 'cors'
import { getDatabase } from './database'
import { setupEmailService } from './emailService'
import { setupCronService } from './cronService'

const app = express()
const port = 3000

app.use(cors())
app.use(express.json())

const db = getDatabase()

// 人员管理
app.get('/api/persons', (req, res) => {
  res.json(db.getAllPersons())
})

app.post('/api/persons', (req, res) => {
  res.json(db.addPerson(req.body))
})

app.put('/api/persons', (req, res) => {
  db.updatePerson(req.body)
  res.json({ success: true })
})

app.delete('/api/persons/:id', (req, res) => {
  db.deletePerson(Number(req.params.id))
  res.json({ success: true })
})

// 班次管理
app.get('/api/shifts', (req, res) => {
  res.json(db.getAllShifts())
})

app.post('/api/shifts', (req, res) => {
  res.json(db.addShift(req.body))
})

app.put('/api/shifts', (req, res) => {
  db.updateShift(req.body)
  res.json({ success: true })
})

app.delete('/api/shifts/:id', (req, res) => {
  db.deleteShift(Number(req.params.id))
  res.json({ success: true })
})

// 周末班次管理
app.get('/api/weekend-shifts', (req, res) => {
  res.json(db.getAllWeekendShifts())
})

app.put('/api/weekend-shifts', (req, res) => {
  db.updateWeekendShift(req.body)
  res.json({ success: true })
})

// 基础数据
app.get('/api/basic-data', (req, res) => {
  res.json(db.getBasicData())
})

app.put('/api/basic-data', (req, res) => {
  db.updateBasicData(req.body)
  res.json({ success: true })
})

// 排班记录
app.get('/api/schedules', (req, res) => {
  const { weekStart } = req.query
  if (weekStart) {
    res.json(db.getSchedule(weekStart as string))
  } else {
    res.json(db.getAllSchedules())
  }
})

app.post('/api/schedules', (req, res) => {
  db.saveSchedule(req.body)
  res.json({ success: true })
})

app.delete('/api/schedules/by-shift/:shiftId', (req, res) => {
  db.clearSchedulesByShiftId(Number(req.params.shiftId))
  res.json({ success: true })
})

app.delete('/api/schedules', (req, res) => {
  const { beforeWeek, fromWeek } = req.query
  if (beforeWeek) {
    db.clearSchedulesBeforeWeek(beforeWeek as string)
  } else if (fromWeek) {
    db.clearSchedulesFromWeek(fromWeek as string)
  } else {
    db.clearAllSchedules()
  }
  res.json({ success: true })
})

app.put('/api/schedules/:weekStart', (req, res) => {
  db.updateSchedule(req.params.weekStart, req.body.scheduleData)
  res.json({ success: true })
})

// 周末排班
app.get('/api/weekend-schedules', (req, res) => {
  const { weekStart } = req.query
  if (weekStart) {
    res.json(db.getWeekendSchedule(weekStart as string))
  } else {
    res.status(400).json({ error: 'weekStart is required' })
  }
})

app.post('/api/weekend-schedules', (req, res) => {
  db.saveWeekendSchedule(req.body)
  res.json({ success: true })
})

// 邮件配置
app.get('/api/email-config', (req, res) => {
  res.json(db.getEmailConfig())
})

app.put('/api/email-config', (req, res) => {
  db.updateEmailConfig(req.body)
  // Re-setup services with new config
  setupEmailService()
  setupCronService()
  res.json({ success: true })
})

// 启动服务
setupEmailService()
setupCronService()

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
