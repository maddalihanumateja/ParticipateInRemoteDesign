var dotenv = require('dotenv').config({path: __dirname + '/.env'});
const Pool = require('pg').Pool

const pool = new Pool({
  user: dotenv.parsed.USER,
  host: dotenv.parsed.HOST,
  database: dotenv.parsed.DATABASE,
  password: dotenv.parsed.PASSWORD,
  port: dotenv.parsed.PORT,
})

const getAllMeetingLogs = (request, response) => {
  pool.query('SELECT * FROM meeting_logs WHERE meeting_host=true ORDER BY id ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getActiveMeetingLogs = (request, response) => {
  pool.query('SELECT * FROM meeting_logs WHERE meeting_ended=false AND meeting_host=true ORDER BY id ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getMeetingLog = (request, response) => {
  const user_name = request.params.user_name
  const meeting_number = parseInt(request.params.meeting_number)

  pool.query('SELECT * FROM meeting_logs WHERE user_name = $1 AND meeting_number = $2;', [user_name, meeting_number], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const createMeetingLog = (request, response) => {
  const {meeting_number, meeting_password, user_name, email, ip_address, user_type, meeting_host} = request.body

  pool.query('INSERT INTO meeting_logs (meeting_number, meeting_password, user_name, email, ip_address, meeting_join_time, meeting_leave_time, user_type, meeting_host, meeting_ended) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);', [meeting_number, meeting_password, user_name, email, ip_address, new Date(), null, user_type, meeting_host, false], (error, results) => {
    if (error) {
      throw error
    }
    response.status(201).send(`User added with ID: ${result.insertId}`)
  })
}

const updateMeetingLogEnded = (request, response) => {
  const user_name = request.params.user_name
  const meeting_number = parseInt(request.params.meeting_number)

  pool.query(
    'UPDATE users SET meeting_ended = true WHERE user_name = $1 AND meeting_number = $2;',
    [user_name, meeting_number],
    (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).send(`User modified with ID: ${id}`)
    }
  )
}

const deleteMeetingLog = (request, response) => {
  const meeting_number = parseInt(request.params.meeting_number)

  pool.query('DELETE FROM meeting_logs WHERE meeting_number = $1;', [meeting_number], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).send(`Meeting Log deleted with ID: ${id}`)
  })
}

module.exports = {
  getAllMeetingLogs,
  getActiveMeetingLogs,
  getMeetingLog,
  createMeetingLog,
  updateMeetingLogEnded,
  deleteMeetingLog,
}