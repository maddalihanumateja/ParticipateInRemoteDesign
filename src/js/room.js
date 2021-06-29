import css from '../css/room_style.scss';
import io from 'socket.io-client';
const { RTCPeerConnection, RTCSessionDescription } = window;

var users_in_room = [];
var user_devices = [];
var user_videos = {};

var pcLocal = {};
var pcRemote = {};
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

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

socket.on('existing_users', function(obj){
      console.log(obj);
      if (Object.values(obj).length > 1) {
        //modal_append(users_in_room[users_in_room.length - 1]);
      }
      for(var socketId in obj){
      	call(obj[socketId], socketId);
      }
});

socket.on('room_join_event', function(obj){
      console.log(obj['users_in_room']);
      users_in_room = obj['users_in_room'].slice();
      console.log(obj['message']);
      if (users_in_room.length > 1) {
        //modal_append(users_in_room[users_in_room.length - 1]);
      }

      call(obj['new_username'], obj['new_peer_id']);
      //emits a socket event that adds the new user
      console.log(user_devices);
});

socket.on('room_leave_event', function(obj){
      console.log(obj['users_in_room']);
      users_in_room = obj['users_in_room'].slice(); //sets users_in_room equal to the new array
      user_devices = user_devices.filter((device) => users_in_room.includes(device['username'])); //returns the filtered array back into user_devices
      console.log(obj['leaving_user_id'], obj['message']);
      let leaving_user_id = obj['leaving_user_id'];
      var video = document.getElementById(leaving_user_id);
      video.remove();
      pcLocal[leaving_user_id].close();
      pcLocal[leaving_user_id]=null;
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

socket.on("answer", (id, description) => {
  console.log("answer "+ id);
  pcLocal[id].setRemoteDescription(description);
});

socket.on("local_candidate", (id, candidate) => {
	console.log("local_candidate "+ id);
	pcLocal[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("remote_candidate", (id, candidate) => {
	console.log("remote_candidate "+ id);
  	pcRemote[id]
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
});

socket.on("offer", (socketId, description) => {
	console.log("offered "+ socketId);
  pcRemote[socketId] = new RTCPeerConnection(servers);
  pcRemote[socketId]
    .setRemoteDescription(description)
    .then(() => pcRemote[socketId].createAnswer())
    .then(sdp => pcRemote[socketId].setLocalDescription(sdp))
    .then(() => {
      socket.emit("answer", socketId, pcRemote[socketId].localDescription);
    });
  pcRemote[socketId].ontrack = event => {
  	var video = user_videos[socketId];	
    addVideoStream(video, event.streams[0], socketId);
  };
  pcRemote[socketId].onicecandidate = event => {
    if (event.candidate) {
      socket.emit("local_candidate", socketId, event.candidate);
    }
  };
});

var researcher_trigger_event = function(obj){
      socket.emit('send_private_message', {'to_username':obj['to_username'], 'message':obj['message'], 'room': obj['room']});
      return false;
}


socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === USER_NAME ? "me" : userName
        }</span> </b>
        <span>${message}</span>
    </div>`;
});

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


let myVideoStream;
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;

const servers = {
  	iceServers: [
    	{
    		urls: ["stun:stun.l.google.com:19302"]
    	}
  	]
};

navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
})
.then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream, USER_NAME);
    videoGrid.append(myVideo);
}).then(()=>{
	//start a socket connection. send a set_room event to the server
	socket.emit('set_room', {'room':ROOM_ID, 'username':USER_NAME});
});


const addVideoStream = (video, stream, id) => {
    video.srcObject = stream;
    video.muted=true;
    video.setAttribute("id", id);
    video.addEventListener("loadedmetadata", () => {
       video.play();
       video.muted=false;
    });
};

function call(userName, socketId) {

	console.log('Starting call to '+userName);
	user_videos[socketId] = document.createElement("video");
	videoGrid.append(user_videos[socketId]);

  	// Create an RTCPeerConnection via the polyfill.
  	
  	let stream = myVideo.srcObject;
  	pcLocal[socketId] = new RTCPeerConnection(servers);
  	stream.getTracks().forEach(track => pcLocal[socketId].addTrack(track, stream));
  	pcLocal[socketId].onicecandidate = event => {
    	if (event.candidate) {
      		socket.emit("remote_candidate", socketId, event.candidate);
    	}
    };

   	console.log('Adding local stream to '+userName+'-Local');
  	
  	pcLocal[socketId]
  	    .createOffer()
  	    .then(sdp => pcLocal[socketId].setLocalDescription(sdp))
  	    .then(() => {
  	      socket.emit("offer", socketId, pcLocal[socketId].localDescription);
  	    });
};


//Messaging
let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("chat_message", {'message':text.value,'username':USER_NAME,'room':ROOM_ID});
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("chat_message", {'message':text.value,'username':USER_NAME,'room':ROOM_ID});
    text.value = "";
  }
});

// UI buttons
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

if(USER_TYPE == "researcher"){
	const inviteButton = document.querySelector("#inviteButton");
	inviteButton.addEventListener("click", (e) => {
	  prompt(
	    "Copy this link and send it to people you want to meet with",
	    window.location.origin+"/room?meeting_number="+ROOM_ID
	  );
	});	
}

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

window.onunload = window.onbeforeunload = () => {
  socket.close();
  pcRemote.forEach(peerConnection => peerConection.close());
  pcLocal.forEach(peerConnection => peerConection.close());
};
