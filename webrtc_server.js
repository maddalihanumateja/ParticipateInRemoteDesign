//#region requires
const { v4: uuidv4 } = require('uuid');
const express = require("express");
const webpack = require('webpack');
const path = require('path');
const webpackDevMiddleware = require('webpack-dev-middleware');
const querystring = require('querystring');


const bodyParser = require('body-parser')
const crypto = require('crypto');
const cors = require('cors')
const config = require('./webpack.config.dev.js');

//load database functions
var pgp = require('pg-promise')();

var dotenv = require('dotenv').config({path: __dirname + '/.env'});
const dbConfig = {
  user: process.env.USER,
  host: process.env.DB_URL,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: parseInt(process.env.DB_PORT),
}
const db = pgp(dbConfig)

const createMeetingLog = (request, response) => {
  const meeting_name = request.body.meeting_name;
  const meeting_password = request.body.meeting_password;
  const user_name = request.body.user_name;
  const email = request.body.email;
  const ip_address = request.body.ip_address;
  const user_type = request.body.user_type;
  const meeting_host = request.body.meeting_host;


  //add user to the users table if necessary
  db.any(`INSERT INTO users (user_name, user_ip_address, user_type, user_email)
      SELECT $1, $2, $3, $4 WHERE NOT EXISTS
      (SELECT * FROM users WHERE user_name = $1::VARCHAR AND user_email= $4::VARCHAR LIMIT 1)`,
      [user_name, ip_address, user_type, email]).then((result)=>{
      console.log(`User created with ID: ${result}`);
    }).catch(function (error) {
    console.log('ERROR in inserting new user in createMeetingLog:', error)
    });

  //add log data to logs table

  db.one(`INSERT INTO logs (meeting_id, user_id, meeting_host, meeting_join_time, meeting_leave_time) 
      SELECT 
      (SELECT max(meeting_id) from meetings WHERE meeting_name = $1::VARCHAR), (SELECT user_id FROM users WHERE user_name = $5::VARCHAR AND user_email = $6::VARCHAR LIMIT 1), 
      $2, $3, $4 RETURNING log_id;`,
      [meeting_name, meeting_host, new Date(), null, user_name, email], log => log.log_id).then((result)=>{
      response.status(201).send(`[${result}]`);
    }).catch(function (error) {
    console.log('ERROR in inserting new log in createMeetingLog:', error)
    });
}

const deleteMeetingLog = (request, response) => {
  const meeting_name = request.params.meeting_name

  db.one('DELETE FROM logs WHERE meeting_name = $1 RETURNING meeting_name;', [meeting_name], log=>log.meeting_name).then((result)=>{ 
    response.status(200).send(`Meeting Log deleted with Meeting Number: ${result}`)}
  );
}

const createMeeting = (request, response) => {
    const meeting_name = request.body.meeting_name;
    const meeting_password = request.body.meeting_password;
    db.one('INSERT INTO meetings (meeting_name, meeting_password, meeting_ended) values (${meeting_name}, ${meeting_password}, ${meeting_ended}) RETURNING meeting_id', {
        meeting_name: meeting_name,
        meeting_password: meeting_password,
        meeting_ended: false
    }, meeting => meeting.meeting_id).then((result)=>{
      response.status(201).send(`[${result}]`);
    }).catch(function (error) {
    console.log('ERROR in createMeeting:', error)
    });
    
}

const getUserMeetingLogs = (request, response) => {
  const user_name = request.params.user_name
  const meeting_name = request.params.meeting_name

  db.any(`SELECT log_id, logs.meeting_id, logs.user_id, meeting_join_time, meeting_leave_time, meeting_host, user_name, meeting_name
      FROM logs
      LEFT JOIN users ON logs.user_id = users.user_id
      LEFT JOIN meetings ON logs.meeting_id = meetings.meeting_id
      WHERE user_name = $1 AND meeting_name = $2;`, [user_name, meeting_name]).then((results)=>{
      response.status(200).json(results)
    }).catch(function (error) {
    console.log('ERROR in getUserMeetingLogs:', error)
    });
}

const getActiveMeetingLogs = (request, response) => {
  db.any("SELECT * FROM meetings WHERE meeting_ended = false").then((results)=>{
      response.status(200).json(results)
    }).catch(function (error) {
    console.log('ERROR in getActiveMeetingLogs:', error)
    });
}

const getAllMeetingLogs = (request, response) => {
  db.any('SELECT * FROM logs WHERE meeting_host=true ORDER BY meeting_id ASC').then((results)=>{
      response.status(200).json(results)
    }).catch(function (error) {
    console.log('ERROR in getAllMeetingLogs:', error)
    });
}

const updateMeetingLog = (user_name, meeting_name) => {
  db.any(
    `WITH user_logs as
    (SELECT log_id, logs.meeting_id, logs.user_id, meeting_join_time, meeting_leave_time, meeting_host, user_name, meeting_name
        FROM logs
        LEFT JOIN users ON logs.user_id = users.user_id
        LEFT JOIN meetings ON logs.meeting_id = meetings.meeting_id
        WHERE user_name = $1 AND meeting_name = $2 ORDER BY meeting_join_time DESC LIMIT 1)
    UPDATE logs set meeting_leave_time = $3 WHERE user_id = (SELECT user_id from users where user_name = $1 limit 1)
     AND meeting_leave_time IS NULL;`,
    [user_name, meeting_name, new Date()]).then(
      console.log(`User:${user_name} has left meeting: ${meeting_name}.`)
    ).catch(function (error) {
    console.log('ERROR in updateMeetingLog:', error)
    });
}

const endMeeting = (meeting_name) => {

  db.none('UPDATE meetings SET meeting_ended = true WHERE meeting_name = $1;',
    [meeting_name]).then(
      console.log(`Meeting Number: ${meeting_name} has ended.`)
    ).catch(function (error) {
    console.log('ERROR in endMeeting:', error)
    });

}

//#endregion

//#region initialize variables and config
const app = express();
var http = require('http').createServer(app)

var io = require('socket.io')(http)

const compiler = webpack(config);

const fileUpload = require('express-fileupload');
//const morgan = require('morgan');
const _ = require('lodash');

//Intialize DB and migrations
//db.createAndMigrateDB();
console.log("Initialized DB", db.dbConfig);

//Initialize server port
const PORT = process.env.PORT || 5000

// socket related variables

//Object storing users connected to the server
var connected_users = {};
//Objects storing users in a specific meeting room
var users_in_room = {};

var chat_log = {};
var device = "";

// Tell express to use the webpack-dev-middleware and use the webpack.config.js
// configuration file as a base.
app.use(webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath,
}));

app.use("/node_modules", express.static(__dirname + '/node_modules'));

app.use(bodyParser.json(), cors())
app.options('*', cors());


// Enable files upload
app.use(fileUpload({
    createParentPath: true,
    limits: {
        fileSize: 2 * 1024 * 1024 * 1024 //2MB max file(s) size
    },
}));

// Add other middleware needed to upload files
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
//app.use(morgan('dev'));

// Make uploads directory static for file hosting
app.use(express.static('uploads'));
app.use("/uploads", express.static(__dirname + '/uploads'));

// view engine setup
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

//#endregion

//#region router for all app endpoints

/* GET home page. */

app.get('/', function(req, res, next) {
	res.render('webrtc_index.ejs');
});


/* GET meeting room. */
app.post("/room_create", (req, res) => {
      console.log("Redirecting to room created with UUID: "+req.body.meeting_name);
    res.redirect(301,'/room?'+querystring.stringify({UUID : req.body.meeting_name}));

});

/* GET meeting room. */
app.get("/room", (req, res) => {
    console.log("Rendering room with UUID: "+req.query.meeting_name);
    let userName, userType, passWord;
    if(req.query.user_type){
      userType = req.query.user_type;
    }
    else{
      userType = "participant";
    }
    if(req.query.user_name){
      userName = req.query.user_name;
    }
    else{
      userName = "";
    }
    if(req.query.meeting_password){
      passWord = req.query.meeting_password;
    }
    else{
      passWord = ""
    }
    res.render("room.ejs", { roomId: req.query.meeting_name, userName: userName, userType : userType, passWord: passWord});
});

/* POST request with meeting details and response with zoom signature */
app.post('/webrtc_sign', (req, res) => {
  const timestamp = new Date().getTime();
  const meetingName = uuidv4();

  /* Authenticate the user here and send a response. For example, if there is no meeting number then create a room with a random meeting number */
  console.log('Sending response');

  res.json({
    meetingName: meetingName,
    user_type : req.body.user_type,
    passWord : req.body.passWord,
    userName : req.body.userName,
    userEmail : req.body.userEmail
  });
})

//#region all DB endpoints
app.get('/meeting_logs', getAllMeetingLogs)

app.get('/meeting_active_logs', getActiveMeetingLogs)

app.get('/meeting_log/:user_name/:meeting_name', getUserMeetingLogs)

app.post('/meeting_log', createMeetingLog)

app.delete('/meeting_log/:meeting_name', deleteMeetingLog)

app.post('/meeting',  createMeeting);

//#endregion

//#endregion

//#region Socket code
//Log messages and broadcast to all clients on test namespace and room

  io.on('connection', function(socket){
      console.log('socket-id "'+socket['id']+'" connected');
      connected_users[socket['id']] = {};//Maybe include the list of devices this client is connected to

      socket.on('message', data => {
        device = data;
      });

      socket.on('disconnect', function(){
        console.log('socket-id "'+socket['id']+'" disconnected');

        delete connected_users[socket['id']];
        for(room in users_in_room){
          for(socket_id in users_in_room[room]){
            if(socket_id == socket['id']){

              //update database meeting logs here
              updateMeetingLog(users_in_room[room][socket_id],room);
              var leaving_username = users_in_room[room][socket_id]
              delete users_in_room[room][socket_id]
              io.to(room).emit('room_leave_event',{'leaving_username':leaving_username,'leaving_user_id':socket_id,'message':'left room '+room, 'users_in_room':Object.values(users_in_room[room]), 'room':room});
              

	// end the meeting if nobody is left
              if (Object.entries(users_in_room[room]).length === 0) {
                endMeeting(room);
              }

		break
            }
          }
          if(socket_id == socket['id']){
            break
          }
        }

      });
      //Listen for set_room event from client

      socket.on('set_room',function(obj){
        console.log('Room name: '+obj['room']+' for username: '+obj['username'])
        socket.join(obj['room']);
        
        if(users_in_room[obj['room']] == null){
          users_in_room[obj['room']] = {}
        }
        io.to(socket['id']).emit('existing_users', users_in_room[obj['room']]);

        if(chat_log[obj['room']]){
          chat_log[obj['room']].forEach(item => io.to(socket['id']).emit("createMessage", item[0], item[1]));
        }

        users_in_room[obj['room']][socket['id']] = obj['username']
        socket.to(obj['room']).emit('room_join_event',{'new_peer_id':socket['id'],'new_username':obj['username'],'message':'joined room '+obj['room'], 'users_in_room':Object.values(users_in_room[obj['room']]), 'room':obj["room"]});

      });

      socket.on("chat_message", (obj) => {
        console.log('Message "'+obj['message']+'" sent to room:'+obj['room']);
        if(!chat_log[obj['room']]){
          chat_log[obj['room']] = [];
        }
        chat_log[obj['room']].push([obj['message'], obj['username']]);
        io.to(obj['room']).emit("createMessage", obj['message'], obj['username']);
      });

      socket.on('send_private_message',function(obj){
        if(Object.values(users_in_room[obj['room']]).indexOf(obj['to_username'])>=0){
          for(var user_socket in users_in_room[obj['room']]){
            if(users_in_room[obj['room']][user_socket] == obj['to_username']){
              console.log('Message "'+obj['message']+'" sent to user:'+users_in_room[obj['room']][user_socket]);
              io.to(user_socket).emit('recieved_private_message',obj['message']);
            }
          }
        }
        else{
          var msg = 'Message not sent to user:'+obj['to_username']+" since the user is not part of this room"
          console.log(msg);
          io.to(socket['id']).emit('recieved_private_message',msg);
        }

      });

      socket.on("offer", (id, message) => {
          socket.to(id).emit("offer", socket.id, message);
      });
      socket.on("answer", (id, message) => {
        socket.to(id).emit("answer", socket.id, message);
      });
      socket.on("local_candidate", (id, message) => {
        socket.to(id).emit("local_candidate", socket.id, message);
      });
      socket.on("remote_candidate", (id, message) => {
        socket.to(id).emit("remote_candidate", socket.id, message);
      });

  });


  // Endpoint for Bluetooth link
  app.get('/ble_rpi', function(req, res, next) {
    res.render('ble_rpi.ejs');
  });

  // Endpoint for server invite link
  app.get('/participant', function(req, res, next) {
    res.render('participant.ejs');
  });

//#endregion
app.post('/upload', async (req, res) => {
    try {
        if(!req.files) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            //Use the name of the input field (i.e. "avatar") to retrieve the uploaded file
            let avatar = req.files.avatar;

            // Gets date in yyyy-mm-dd format
            let date = (new Date()).toISOString().split('T')[0];
            console.log('/uploads/' + date + '/' + avatar.name);
            //Use the mv() method to place the file in upload directory and then by date
            avatar.mv('./uploads/' + date + '/' + avatar.name);

            // Emit file metadata
            io.sockets.emit('clientEvent', {
                name: avatar.name,
                mimetype: avatar.mimetype,
                size: avatar.size
            });
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

// Serve the files on PORT.
const listener = http.listen(PORT, function () {
  console.log('Example app listening on port 5000!\n');
});

app.get('/devices.txt', (req, res) => {
  res.send(device);
});

// Webhook endpoint for when someone joins the meeting
app.post('/participant_joined', (req, res) => {
  console.log(req.body['payload'].object.participant['user_id'] + " has joined the meeting.");
})
