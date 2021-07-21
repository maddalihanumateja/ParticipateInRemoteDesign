var dotenv = require('dotenv').config({path: __dirname + '/.env'});
const {Pool} = require('pg')
const {createDb, migrate} = require("postgres-migrations")

const dbConfig = {
  user: process.env.HOST,
  host: process.env.DB_URL,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: parseInt(process.env.DB_PORT),
}

const pool = new Pool(dbConfig)

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
      console.log("Error getActiveMeetingLogs");
      throw error
    }
    console.log(results.rows);
    response.status(200).json(results.rows)
  });
  console.log("Called getActiveMeetingLogs");
}

const getMeetingLog = (request, response) => {
  const user_name = request.params.user_name
  const meeting_name = request.params.meeting_name

  pool.query(`SELECT log_id, logs.meeting_id, logs.user_id, meeting_join_time, meeting_leave_time, meeting_host, user_name, meeting_name
      FROM logs
      LEFT JOIN users ON logs.user_id = users.user_id
      LEFT JOIN meetings ON logs.meeting_id = meetings.meeting_id
      WHERE user_name = $1 AND meeting_name = $2;`, [user_name, meeting_name], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const getOtherUsersForMeeting = (request, response) => {
  const user_name = request.params.user_name
  const meeting_name = request.params.meeting_name

  pool.query(`SELECT DISTINCT user_name
      FROM logs
      LEFT JOIN meetings on logs.meeting_id = meetings.meeting_id
      LEFT JOIN users on logs.user_id = users.user_id
      WHERE meeting_name = $1 AND meeting_ended=false AND user_name!= $2 AND meeting_leave_time = NULL;`,
      [meeting_name, user_name], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).json(results.rows)
  })
}

const createMeeting = (request, response) => {
  const meeting_name = request.body.meeting_name;
  const meeting_password = request.body.meeting_password;
  console.log(request.body.user_type);
  if (request.body.user_type != 'participant') {
    pool.query('INSERT INTO meetings (meeting_name, meeting_password, meeting_ended) values ($1, $2, $3)',
     [meeting_name, meeting_password, false], (error, results) => {
      if (error) {
        console.log(request);
        console.log("Error createMeeting");
        throw error
      }
      response.status(201).send(`Meeting created with ID: ${results.insertId}`)
    })
  }
    console.log("Called createMeeting");
}

const createMeetingLog = (request, response) => {
  const meeting_name = request.body.meeting_name;
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
      console.log("Error createMeetingLog");
      throw error
    }
  })
  console.log("Called createMeetingLog");

  //add log data to logs table
  // pool.query(`INSERT INTO logs (meeting_id, meeting_join_time, meeting_leave_time, meeting_host, user_id)
  //   SELECT
  //     (SELECT max(meeting_id) from meetings WHERE meeting_name = $1),
  //     $2, $3, $4,
  //     (SELECT user_id FROM users WHERE user_name = $5 AND user_email = $6);`,
  //     [meeting_name, new Date(), null, meeting_host, user_name, email], (error, results) => {
  //   if (error) {
  //     console.log(request);
  //     throw error
  //   }
  //   response.status(201).send(`Meeting Log added with ID: ${results.insertId}`)
  // })

}

const updateMeetingLog = (user_name, meeting_name) => {
  const meeting_name = meeting_name

  pool.query(
    `WITH user_logs as
    (SELECT log_id, logs.meeting_id, logs.user_id, meeting_join_time, meeting_leave_time, meeting_host, user_name, meeting_name
        FROM logs
        LEFT JOIN users ON logs.user_id = users.user_id
        LEFT JOIN meetings ON logs.meeting_id = meetings.meeting_id
        WHERE user_name = $1 AND meeting_name = $2 ORDER BY meeting_join_time DESC LIMIT 1)
    UPDATE logs set meeting_leave_time = $3 WHERE user_id = (SELECT user_id from users where user_name = $1 limit 1)
     AND meeting_leave_time IS NULL;`,
    [user_name, meeting_name, new Date()],
    (error, results) => {
      if (error) {
        throw error
      }
      return(`User:${user_name} has left meeting: ${meeting_name}.`)
    }
  )
}

const endMeeting = (meeting_name) => {
  const meeting_name = meeting_name

  pool.query('UPDATE meetings SET meeting_ended = true WHERE meeting_name = $1;',
    [meeting_name],
    (error, results) => {
      if (error) {
        throw error
      }
      return(`Meeting Number: ${meeting_name} has ended.`)
    }
  )
}

const deleteMeetingLog = (request, response) => {
  const meeting_name = request.params.meeting_name

  pool.query('DELETE FROM logs WHERE meeting_name = $1;', [meeting_name], (error, results) => {
    if (error) {
      throw error
    }
    response.status(200).send(`Meeting Log deleted with Meeting Number: ${meeting_name}`)
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
  dbConfig,
  endMeeting
}
