import css from '../css/room_style.scss';
//import io from 'socket.io-client';
//import Peer from 'peerjs';

var users_in_room =[];
var user_devices = [];

//load the connected devices variable
var socket = io();

var devices = "";

//If researcher
/*
$.get("/devices.txt", function(data, status){
        console.log(data);
        devices = data;
    });
*/



// Other socket.io session events



function modal_append(name) {

let modal = document.getElementById("modal-content");
let modalsText2;
modal.innerHTML = '';

if (devices.includes("printer")) {
  let modalsText2 = $('<div><img src=\'https://icons-for-free.com/iconfiles/png/512/interface+multimedia+print+printer+icon-1320185667007730348.png\' style = \'max-height:70px;float:left\' /><span style =\'font-size:50px;padding-left:2%;\'>Printer</span><br><br><label for=\'participants\'>Choose a participant:</label><br><select name=\'participants\' class=\'participant-list\'></select><br><br><p>Upload a file:<form method=\'post\' action=\'upload\' enctype=\'multipart/form-data\'><input type=\'file\' name=\'avatar\'><input type=\'submit\'></form></p></div>');
  $(modalsText2).appendTo(modal);
  let nameElement = $('<option value=\'' + name + '\'>' + name + '</option>');
  var content = document.getElementsByClassName("participant-list");
  $(nameElement).appendTo(content);
}

if (devices.includes("projector")) {
  let modalsText2 = $('<div><img src =\'https://cdn1.iconfinder.com/data/icons/healthcare-medical-line/32/healthcare_health_medical_presentation_projection_projector_device-512.png\' style = \'max-height:70px;float:left\' /><span style = \'font-size:50px;padding-left:2%;\'>Projector</span> </div><br><label for=\'participants\'>Choose a participant:</label><br><select name=\'participants\' class=\'participant-list\'></select><br><br></div>');
  $(modalsText2).appendTo(modal);
  let nameElement = $('<option value=\'' + name + '\'>' + name + '</option>');
  var content = document.getElementsByClassName("participant-list");
  $(nameElement).appendTo(content);
}


}

socket.on('room_leave_event', function(obj){
      console.log(obj['users_in_room']);
      users_in_room = obj['users_in_room'].slice(); //sets users_in_room equal to the new array
      user_devices = user_devices.filter((device) => users_in_room.includes(device['username'])); //returns the filtered array back into user_devices
      console.log(obj['message']);
    });

socket.on('recieved_private_message', function(msg){
      console.log(msg);
    });

socket.on('send_available_devices', function(obj) {
    console.log(obj);
    if ((user_devices.filter((device) => obj['username'] === device['username'])).length == 0) { //checks if the json object is already contained in the array
        user_devices.push(obj);
    }
    console.log(user_devices);
});


var researcher_trigger_event = function(obj){
      socket.emit('send_private_message', {'to_username':obj['to_username'], 'message':obj['message'], 'room': obj['room']});
      return false;
}

var observer = new MutationObserver(function (mutations) {
    console.log("mutation spotted");
    mutations.forEach(function (mutation) {
        if (mutation.addedNodes.length) {
            var counter;
            // for (counter = 1; counter < users_in_room.length; counter++) {
            //     let aElement = $('<form method=\'post\' action=\'upload\' enctype=\'multipart/form-data\'><input type=\'file\' name=\'avatar\'><input type=\'submit\'></form>');
            //     let node = document.getElementById('participants-list-0');
            //     $(aElement).attr( {
            //         id: counter
            //     });
            //     $(aElement).appendTo(node);
            // }
        }
        if (mutation.removedNodes.length) {
            console.log('Removed');
        }
    });
});

var observerConfig = {
    childList: true
};

 /*

        const iElement = $('<input id=\"file-input\" type=\"file\" style=\"display: none;\" />');
        $(iElement).appendTo('#mtg-root');

        const container = document.querySelector('div.meeting-client-inner');
        observer.observe(container.childNodes[0], observerConfig);

        console.log('join meeting success!');



        if (USER_TYPE == 'researcher') {
          let modals = $('<div id=\'myModal\' class=\'modal\' style = \'display: none;position: fixed;z-index: 1;padding-top: 100px;left: 0;top: 0;width: 100%;height: 100%;overflow: auto;background-color: rgb(0,0,0);background-color: rgba(0,0,0,0.4);\'></div>');
          let modalInner = $('<div class=\'modal-content\' id=\'modal-content\' style = \'background-color: #fefefe;float:right;padding: 20px;border: 1px solid #888;width: 500px;\'><span class=\'close\'>&times;</span></div>');
          let modalsText = $('<span>No devices found.</span>');

          let footerLeft = document.getElementById("wc-footer-left");

          let bElement = $('<div class = \'send-video-container left-tool-item\'><img src = \'https://imgur.com/a/JzmeMyR\' id=\'project\' style=\'max-width: 90%;max-height: 70%;\' /><br>Devices<span class=\'loading\' style=\'display: none;\'></span></div>');
          $(modalsText).appendTo(modalInner);
          $(modalInner).appendTo(modals);
          $(bElement).appendTo(footerLeft);
          $(modals).appendTo("body");

          var modal = document.getElementById("myModal");

          // Get the button that opens the modal
          var btn = document.getElementById("project");

          // Get the <span> element that closes the modal
          var span = document.getElementsByClassName("close")[0];

          // When the user clicks the button, open the modal
          btn.onclick = function() {
            modal.style.display = "block";
          }

          // When the user clicks on <span> (x), close the modal
          span.onclick = function() {
            modal.style.display = "none";
          }

          // When the user clicks anywhere outside of the modal, close it
          window.onclick = function(event) {
            if (event.target == modal) {
              modal.style.display = "none";
            }
          }
        }
        */


var peer = new Peer(undefined, {
  path: "/myapp",
  host: "/",
  port: "5000",
});

let myVideoStream;
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
})
.then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on('room_join_event', function(obj){
          console.log(obj['users_in_room']);
          users_in_room = obj['users_in_room'].slice();
          console.log(obj['message']);
          if (users_in_room.length > 1) {
            modal_append(users_in_room[users_in_room.length - 1]);
          }
          connectToNewUser(obj['new_peer_id'], stream);
           //emits a socket event that adds the new user
          console.log(user_devices);
    });
});


const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
       video.play();
       videoGrid.append(video);
    });
};

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
};

//

peer.on("open", (id) => {
//start a socket connection. send a set_room event to the server
	socket.emit('set_room', {'room':ROOM_ID, 'username':USER_NAME, 'id': id});
});


//Messaging
let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

// UI buttons
const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");



muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    var html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    var html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    var html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    var html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});


socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === user ? "me" : userName
        }</span> </b>
        <span>${message}</span>
    </div>`;
});
