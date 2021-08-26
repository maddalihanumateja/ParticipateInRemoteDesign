//#region requires
const express = require("express");
const webpack = require('webpack');
const path = require('path');
const webpackDevMiddleware = require('webpack-dev-middleware');

const bodyParser = require('body-parser')
const crypto = require('crypto');
const cors = require('cors')
const config = require('./webpack.config.dev.js');

//load database functions
const db = require('./queries')

var dotenv = require('dotenv').config({path: __dirname + '/.env'});
//#endregion

//#region initialize variables and config
const app = express();
var http = require('http').createServer(app)
const fs = require("fs");

if(false){
  const key = fs.readFileSync("./https/key.pem");
  const cert = fs.readFileSync("./https/cert.pem");
  var http = require('https').createServer({key: key, cert: cert},app);
}

var io = require('socket.io')(http)

const compiler = webpack(config);

const fileUpload = require('express-fileupload');
const morgan = require('morgan');
const _ = require('lodash');

//Intialize DB and migrations
db.createAndMigrateDB();

//Initialize server port
const PORT = process.env.PORT || 5000

// socket related variables

//Object storing users connected to the server
var connected_users = {};
//Objects storing users in a specific meeting room
var users_in_room = {};

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
app.use(morgan('dev'));

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
	res.render('new_index.ejs');
});

/* POST request with meeting details and response with zoom signature */
app.post('/zoom_sign', (req, res) => {

  //zoom websdk signature example was updated 5 days back
  //https://github.com/zoom/websdk-sample-signature-node.js/commit/7908e9da02cea12a969c792686565f746882f462
  const timestamp = new Date().getTime()-30000;
  const msg = Buffer.from(process.env.API_KEY + req.body.meetingNumber + timestamp + req.body.role).toString('base64');
  const hash = crypto.createHmac('sha256', process.env.API_SECRET).update(msg).digest('base64');
  const signature = Buffer.from(`${process.env.API_KEY}.${req.body.meetingNumber}.${timestamp}.${req.body.role}.${hash}`).toString('base64');

  res.json({
    signature: signature,
    API_KEY: process.env.API_KEY
  });
  console.log("Sent response");
})

//#region all DB endpoints
app.get('/meeting_logs', db.getAllMeetingLogs)
app.get('/meeting_active_logs', db.getActiveMeetingLogs)
app.get('/meeting_log/:user_name/:meeting_number', db.getMeetingLog)
app.post('/meeting_log', db.createMeetingLog)
app.delete('/meeting_log/:meeting_number', db.deleteMeetingLog)
app.post('/meeting', db.createMeeting)

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
              console.log(db.updateMeetingLog(users_in_room[room][socket_id],room));

              delete users_in_room[room][socket_id]
              io.to(room).emit('room_leave_event',{'message':'left room '+room, 'users_in_room':Object.values(users_in_room[room]), 'room':room});

	// end the meeting if nobody is left
              if (Object.entries(users_in_room[room]).length === 0) {
                console.log(db.endMeeting(room));
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
        users_in_room[obj['room']][socket['id']] = obj['username']
        io.to(obj['room']).emit('room_join_event',{'message':'joined room '+obj['room'], 'users_in_room':Object.values(users_in_room[obj['room']]), 'room':obj["room"]});
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

io.on('connection', function (socket) {
    console.log('connected:', socket.client.id);
    socket.on('serverEvent', function (data) {
        console.log('new message from client:', data);
    });
});

// Serve the files on PORT.
http.listen(PORT, function () {
  console.log('Example app listening on port 5000!\n');
});

app.get('/devices.txt', (req, res) => {
  res.send(device);
});

// Webhook endpoint for when someone joins the meeting
app.post('/participant_joined', (req, res) => {
  console.log(req.body['payload'].object.participant['user_id'] + " has joined the meeting.");
})
