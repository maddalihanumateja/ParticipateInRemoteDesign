var dotenv = require('dotenv').config({path: __dirname + '/.env'});
const Pool = require('pg').Pool
const {createDb, migrate} = require("postgres-migrations")

const dbConfig = {
  user: process.env.USER,
  host: process.env.DB_URL,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: parseInt(process.env.DB_PORT),
}

const pool = new Pool(dbConfig)

function createAndMigrateDB() {
    createDb(process.env.DATABASE, dbConfig).then(() => {
        return migrate(dbConfig, "migrations")
        // "migrations" is the path where all the migration files are contained
    }).then(() => {} )
    .catch((err) => {
        console.log(err)
    })
}

const getAllMeetingLogs = (request, response) => {
  pool.query('SELECT * FROM logs WHERE meeting_host=true ORDER BY meeting_id ASC', (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getActiveMeetingLogs = (request, response) => {
  pool.query("SELECT * FROM meetings WHERE meeting_ended = false;", (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getMeetingLog = (request, response) => {
  const user_name = request.params.user_name
  const meeting_number = parseInt(request.params.meeting_number)

  pool.query(`SELECT log_id, logs.meeting_id, logs.user_id, meeting_join_time, meeting_leave_time, meeting_host, user_name, meeting_number
      FROM logs
      LEFT JOIN users ON logs.user_id = users.user_id
      LEFT JOIN meetings ON logs.meeting_id = meetings.meeting_id
      WHERE user_name = $1 AND meeting_number = $2;`, [user_name, meeting_number], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getOtherUsersForMeeting = (request, response) => {
  const user_name = request.params.user_name
  const meeting_number = parseInt(request.params.meeting_number)

  pool.query(`SELECT DISTINCT user_name
      FROM logs
      LEFT JOIN meetings on logs.meeting_id = meetings.meeting_id
      LEFT JOIN users on logs.user_id = users.user_id
      WHERE meeting_number = $1 AND meeting_ended=false AND user_name!= $2 AND meeting_leave_time = NULL;`,
      [meeting_number, user_name], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const createMeeting = (request, response) => {
  const meeting_number = request.body.meeting_number;
  const meeting_password = request.body.meeting_password;

  pool.query('INSERT INTO meetings (meeting_number, meeting_password, meeting_ended) values ($1, $2, $3)',
   [meeting_number, meeting_password, false], (error, results) => {
    if (error) {
      console.log(request);
      throw error
    }
    response.status(201).send(`Meeting created with ID: ${results.insertId}`)
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

  //add user to the users table if necessary
  pool.query(`INSERT INTO users (user_name, user_email, user_ip_address, user_type)
      SELECT $1, $2, $3, $4 WHERE NOT EXISTS
      (SELECT * FROM users WHERE user_name = $1::VARCHAR AND user_email= $2::VARCHAR LIMIT 1);`,
      [user_name, email, ip_address, user_type], (error, results) => {
    if (error) {
      console.log(request);
      throw error
    }
  })

  //add log data to logs table
  pool.query(`INSERT INTO logs (meeting_id, meeting_join_time, meeting_leave_time, meeting_host, user_id)
    SELECT
      (SELECT max(meeting_id) from meetings WHERE meeting_number = $1),
      $2, $3, $4,
      (SELECT user_id FROM users WHERE user_name = $5 AND user_email = $6);`,
      [meeting_number, new Date(), null, meeting_host, user_name, email], (error, results) => {
    if (error) {
      console.log(request);
      throw error
    }
    response.status(201).send(`Meeting Log added with ID: ${results.insertId}`)
  })

}

const updateMeetingLog = (user_name, meeting_num) => {
  const meeting_number = parseInt(meeting_num)

  pool.query(
    `WITH user_logs as
    (SELECT log_id, logs.meeting_id, logs.user_id, meeting_join_time, meeting_leave_time, meeting_host, user_name, meeting_number
        FROM logs
        LEFT JOIN users ON logs.user_id = users.user_id
        LEFT JOIN meetings ON logs.meeting_id = meetings.meeting_id
        WHERE user_name = $1 AND meeting_number = $2 ORDER BY meeting_join_time DESC LIMIT 1)
    UPDATE logs set meeting_leave_time = $3 WHERE user_id = (SELECT user_id from users where user_name = $1)
     AND meeting_leave_time IS NULL;`,
    [user_name, meeting_number, new Date()],
    (error, results) => {
      if (error) {
        throw error
      }
      return(`User:${user_name} has left meeting: ${meeting_number}.`)
    }
  )
}

const endMeeting = (meeting_num) => {
  const meeting_number = parseInt(meeting_num)

  pool.query('UPDATE meetings SET meeting_ended = true WHERE meeting_number = $1;',
    [meeting_number],
    (error, results) => {
      if (error) {
        throw error
      }
      return(`Meeting Number: ${meeting_number} has ended.`)
    }
  )
}

const deleteMeetingLog = (request, response) => {
  const meeting_number = parseInt(request.params.meeting_number)

  pool.query('DELETE FROM logs WHERE meeting_number = $1;', [meeting_number], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).send(`Meeting Log deleted with Meeting Number: ${meeting_number}`)
  })
}

module.exports = {
  getAllMeetingLogs,
  getActiveMeetingLogs,
  getMeetingLog,
  createMeeting,
  createMeetingLog,
  deleteMeetingLog,
  updateMeetingLog,
  createAndMigrateDB,
  endMeeting
}
