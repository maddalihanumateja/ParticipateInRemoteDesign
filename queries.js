var dotenv = require('dotenv').config({path: __dirname + '/.env'});
const Pool = require('pg').Pool
const {createDb, migrate} = require("postgres-migrations")

createAndMigrateDB()

const pool = new Pool({
  user: dotenv.parsed.USER,
  host: dotenv.parsed.HOST,
  database: dotenv.parsed.DATABASE,
  password: dotenv.parsed.PASSWORD,
  port: dotenv.parsed.PORT,
})

function createAndMigrateDB() {
    createDb("database-name", {
        user: dotenv.parsed.USER,
        host: dotenv.parsed.HOST,
        database: dotenv.parsed.DATABASE,
        password: dotenv.parsed.PASSWORD,
        port: parseInt(dotenv.parsed.PORT)
    }).then(() => {
        return migrate({
            user: dotenv.parsed.USER,
            host: dotenv.parsed.HOST,
            database: dotenv.parsed.DATABASE,
            password: dotenv.parsed.PASSWORD,
            port: parseInt(dotenv.parsed.PORT)
        }, "migrations")
        // "migrations" is the path where all the migration files are contained
    }).then(() => {} )
    .catch((err) => {
        console.log(err)
    })
}

const getAllMeetingLogs = (request, response) => {
  pool.query('SELECT * FROM meeting_logs WHERE meeting_host=true ORDER BY meeting_id ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getActiveMeetingLogs = (request, response) => {
  pool.query("SELECT * FROM meeting_logs WHERE meeting_ended=false AND meeting_host=true AND user_type='researcher' ORDER BY meeting_id ASC", (error, results) => {
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

const getOtherUsersForMeeting = (request, response) => {
  const user_name = request.params.user_name
  const meeting_number = parseInt(request.params.meeting_number)

  pool.query('SELECT UNIQUE(user_name) FROM meeting_logs WHERE meeting_number = $1 AND meeting_ended=false AND user_name!= $2 AND meeting_leave_time = NULL;', [meeting_number, user_name], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const createMeetingLog = (request, response) => {
  const meeting_number = request.body.meeting_number;
  const meeting_password = request.body.meeting_password;
  const user_name = request.body.user_name;
  const email = request.body.email;
  const ip_address = request.body.ip_address;
  const user_type = request.body.user_type;
  const meeting_host = request.body.meeting_host;

  pool.query('INSERT INTO meeting_logs (meeting_number, meeting_password, user_name, email, ip_address, meeting_join_time, meeting_leave_time, user_type, meeting_host, meeting_ended) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);', [meeting_number, meeting_password, user_name, email, ip_address, new Date(), null, user_type, meeting_host, false], (error, results) => {
    if (error) {
      console.log(request);
      throw error
    }
    response.status(201).send(`Meeting Log added with ID: ${results.insertId}`)
  })
}

const updateMeetingLogEnded = (request, response) => {
  const user_name = request.params.user_name
  const meeting_number = parseInt(request.params.meeting_number)

  pool.query(
    'UPDATE meeting_logs SET meeting_ended = true WHERE user_name = $1 AND meeting_number = $2 AND meeting_host = true;',
    [user_name, meeting_number],
    (error, results) => {
      if (error) {
        throw error
      }
      response.status(200).send(`Set meeting_ended=true for Meeting Log with ID: ${meeting_number}`)
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
