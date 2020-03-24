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
var http = require('http').createServer(app);
var io = require('socket.io')(http)
const compiler = webpack(config);

// socket related variables

//Object storing users connected to the server
var connected_users = {};
//Objects storing users in a specific meeting room
var users_in_room = {};

// Tell express to use the webpack-dev-middleware and use the webpack.config.js
// configuration file as a base.
app.use(webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath,
}));

app.use("/node_modules", express.static(__dirname + '/node_modules'));

app.use(bodyParser.json(), cors())
app.options('*', cors());


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
  
  const timestamp = new Date().getTime();
  const msg = Buffer.from(dotenv.parsed.API_KEY + req.body.meetingNumber + timestamp + req.body.role).toString('base64');
  const hash = crypto.createHmac('sha256', dotenv.parsed.API_SECRET).update(msg).digest('base64');
  const signature = Buffer.from(`${dotenv.parsed.API_KEY}.${req.body.meetingNumber}.${timestamp}.${req.body.role}.${hash}`).toString('base64');

  res.json({
    signature: signature,
    API_KEY: dotenv.parsed.API_KEY
  });
  console.log("Sent response");
})

//#region all DB endpoints
app.get('/meeting_logs', db.getAllMeetingLogs)
app.get('/meeting_active_logs', db.getActiveMeetingLogs)
app.get('/meeting_log/:user_name/:meeting_number', db.getMeetingLog)
app.post('/meeting_log', db.createMeetingLog)
app.put('/meeting_log/:user_name/:meeting_number', db.updateMeetingLogEnded)
app.delete('/meeting_log/:meeting_number', db.deleteMeetingLog)

//#endregion

//#endregion

//#region Socket code
//Log messages and broadcast to all clients on test namespace and room

  io.on('connection', function(socket){
      console.log('socket-id "'+socket['id']+'" connected');
      connected_users[socket['id']] = {};//Maybe include the list of devices this client is connected to


      socket.on('disconnect', function(){
        console.log('socket-id "'+socket['id']+'" disconnected');
        delete connected_users[socket['id']];
        for(room in users_in_room){
          for(socket_id in users_in_room[room]){
            if(socket_id == socket['id']){
              delete users_in_room[room][socket_id]
              io.to(room).emit('room_leave_event',{'message':'left room '+room, 'users_in_room':users_in_room[room].keys(), 'room':room});
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
        io.to(obj['room']).emit('room_join_event',{'message':'joined room '+obj['room'], 'users_in_room':users_in_room[obj['room']].keys(), 'room':obj["room"]});
      });

      socket.on('send_private_message',function(obj){
        if(obj['to_username'] in users_in_room[obj['room']].values()){
          for(var user_socket in users_in_room[obj['room']]){
            if(users_in_room[obj['room']][user_socket] == obj['to_username']){
              console.log('Message "'+obj['message']+'" sent to socket_id:'+users_in_room[obj['room']][user_socket]);
              io.to(users_in_room[obj['room']][user_socket]).emit('recieved_private_message',obj['message']);  
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

//#endregion

// Serve the files on port 3000.
http.listen(3000, function () {
  console.log('Example app listening on port 3000!\n');
});
