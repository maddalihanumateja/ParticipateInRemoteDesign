import { ZoomMtg } from '@zoomus/websdk';
import css from '../css/style.scss';
import io from 'socket.io-client';

console.log('checkSystemRequirements');
console.log(JSON.stringify(ZoomMtg.checkSystemRequirements()));

// it's option if you want to change the WebSDK dependency link resources. setZoomJSLib must be run at first
//ZoomMtg.setZoomJSLib('https://source.zoom.us/1.7.8/lib', '/av'); // CDN version default
// else ZoomMtg.setZoomJSLib('https://jssdk.zoomus.cn/1.7.8/lib', '/av'); // china cdn option
// ZoomMtg.setZoomJSLib('http://localhost:9999/node_modules/@zoomus/websdk/dist/lib', '/av'); // Local version default, Angular Project change to use cdn version
ZoomMtg.preLoadWasm();
ZoomMtg.prepareJssdk();

//Hide the zoom meeting window
$('#zmmtg-root').hide();
$('#researcher_side_form').hide();
$('#participant_side_form').hide();

var ip_address="0.0.0.0";
$.get('https://api.ipify.org?format=json', function(data, status) {
    ip_address = data.ip;
});

var users_in_room =[];
var user_devices = [];

//load the connected devices variable
var socket = io();

var devices = "";

//When you click on the participant side hide the researcher side and display the participant's options
document.getElementById('participant_side').addEventListener('click', (e) => {

    $('#researcher_side').hide(400);
    $('#participant_side_init_message').hide();
    //Change to log only active meetings
    $.get("/meeting_active_logs", function(data, status){
        if(data.length==0){
            $('#participant_side_meetings').html('<h3>No Active Meetings Found</h3>');
            $('#participant_side_form').hide();
        }
        else{
            $('#participant_side_meetings').html('<h4>'+data.length+' Active Meetings Found</h4>');
            $('#participant_side_form').show();
            $('#participant_meeting_buttons').html("");
            for(var i=0;i<data.length;i++){
                var button = document.createElement("button");
                button.innerHTML = 'Click here to join meeting '+(i+1);
                button.classList.add('btn','btn-primary');
                button.setAttribute("id","pjoin_mtg_"+(i+1));
                var meetConfig_i = {
                        meetingNumber: parseInt(data[i].meeting_number),
                        passWord: data[i].meeting_password,
                        user_type: 'participant',
                        leaveUrl: 'https://zoom.us',
                        ip_address: ip_address,
                        role: 0
                    };
                // 3. Add event handler
                button.addEventListener ("click", function(e) {
                        e.preventDefault();
                        //Get user name and email only after the join button is clicked
                        meetConfig_i["userName"] = document.getElementById('participant_display_name').value;
                        meetConfig_i["userEmail"] = "";
                        initialize_button_click(meetConfig_i);
                });
                $('#participant_meeting_buttons').append(button);
            }

        }
    });

    // Note: Get meetConfig from the server. Search for available (running) meetings in a meetings table.
    // The meetings list should be updated whenever the researcher starts a meeting.
    // Display how many meetings are currently available for the participant.
    // Ask for the participant's name (Or, for example, let them choose from a list of avatars/nicknames if they can't write their name for some reason).
    // Display Join Meeting Button
    // Update user logs if joining the meeting is successful (meeting number, user-name (manually entered or chosen automatically), i.p. address, join meeting time, researcher?, leave meeting time)
    // Update user logs if the user leaves the meeting (with leave meeting time)

});

//When you click on the researcher side hide the participant side and display the participant's options
document.getElementById('researcher_side').addEventListener('click', (e) => {

    $('#participant_side').hide(400);
    $('#researcher_side_init_message').hide();
    $('#researcher_side_form').show(100);

    $.get("/devices.txt", function(data, status){
        console.log(data);
        devices = data;
    });

    $.get("/meeting_active_logs", function(data, status){
        if(data.length==0){
            $('#researcher_side_meetings').html('<h3>No Active Meetings Found</h3>');
        }
        else{
            $('#researcher_side_meetings').html('<h4>'+data.length+' Active Meetings Found.<br><br>You can join these as an audience member.</h4>');
            $('#researcher_meeting_buttons').html("");
            for(var i=0;i<data.length;i++){
                var button = document.createElement("button");
                button.innerHTML = 'Click here to join meeting '+(i+1);
                button.classList.add('btn','btn-primary');
                button.setAttribute("id","rjoin_mtg_"+(i+1));
                var meetConfig_i = {
                        meetingNumber: parseInt(data[i].meeting_number),
                        passWord: data[i].meeting_password,
                        user_type: 'researcher',
                        leaveUrl: 'https://zoom.us',
                        ip_address: ip_address,
                        role: 0
                    };
                // 3. Add event handler
                button.addEventListener ("click", function(e) {
                        e.preventDefault();
                        //Get user name and email only after the join button is clicked
                        meetConfig_i["userName"] = document.getElementById('display_name').value;
                        meetConfig_i["userEmail"] = document.getElementById('display_email').value;
                        initialize_button_click(meetConfig_i);
                });
                $('#researcher_meeting_buttons').append(button);
            }
        }
    });

    // Note: Get meetConfig from the server. Search for available (running) meetings in a meetings table. This is for when another researcher would like to join an existing meeting.
    // The meetings list should be updated whenever the researcher starts a meeting.
    // Display how many meetings are currently available for the participant.
    // Ask for the participant's name (Or, for example, let them choose from a list of avatars/nicknames if they can't write their name for some reason).
    // Update user logs if starting the meeting is successful (meeting number, user-name (manually entered or chosen automatically), i.p. address, join meeting time, researcher?, leave meeting time)

});

document.getElementById('start_meeting').addEventListener('click', (e) => {
    e.preventDefault();
    initialize_button_click({
        meetingNumber: parseInt(document.getElementById('meeting_number').value, 10),
        userName: document.getElementById('display_name').value,
        userEmail: document.getElementById('display_email').value,
        passWord: document.getElementById('meeting_password').value,
        user_type: 'researcher',
        leaveUrl: 'https://zoom.us',
        ip_address: ip_address,
        role: 1
    });
});

var initialize_button_click = (meetConfig) => {

    fetch('/zoom_sign', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(meetConfig)
    }).then((response) => {
        return response.json();
    })
    .then((data) => {
        //Note: Initialize ZoomMtg with a leaveUrl that informs the server the researcher has ended the session.
        ZoomMtg.init({
                leaveUrl: 'http://www.zoom.us',
                success() {
                    ZoomMtg.join(
                        {
                            meetingNumber: meetConfig.meetingNumber,
                            userName: meetConfig.userName,
                            signature: data.signature,
                            apiKey: data.API_KEY,
                            userEmail: meetConfig.userEmail,
                            passWord: meetConfig.passWord,
                            success: (success) => {
                                $('#zmmtg-root').show(200);
                                console.log('Creating a meeting');
                                fetch('/meeting', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({meeting_number: meetConfig.meetingNumber,
                                        meeting_password: meetConfig.passWord,
                                        user_name: meetConfig.userName,
                                        email: meetConfig.userEmail,
                                        ip_address: meetConfig.ip_address,
                                        user_type: meetConfig.user_type,
                                        meeting_host: meetConfig.role = 1 ? true:false})
                                    }).then((response) => {
                                    return response.json();
                                }).then((data) => {console.log(data)});

                                console.log('Creating a meeting log');
                                fetch('/meeting_log', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({meeting_number: meetConfig.meetingNumber,
                                        meeting_password: meetConfig.passWord,
                                        user_name: meetConfig.userName,
                                        email: meetConfig.userEmail,
                                        ip_address: meetConfig.ip_address,
                                        user_type: meetConfig.user_type,
                                        meeting_host: meetConfig.role = 1 ? true:false})
                                    }).then((response) => {
                                    return response.json();
                                }).then((data) => {console.log(data)});

                                //start a socket connection. send a set_room event to the server
                                socket.emit('set_room', {'room':meetConfig.meetingNumber, 'username':meetConfig.userName});

                                const iElement = $('<input id=\"file-input\" type=\"file\" style=\"display: none;\" />');
                                $(iElement).appendTo('#zmmtg-root');

                                const container = document.querySelector('div.meeting-client-inner');
                                observer.observe(container.childNodes[0], observerConfig);

                                console.log('join meeting success!');



                                if (meetConfig.user_type == 'researcher') {
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

                            },
                            error: (error) => {
                                console.log(error);
                                //If there is an error in starting the meeting then the projector and printer buttons should not be displayed for the researcher
                            }
                        }
                    );
                },
                error(res) {
                    console.log(res);
                }
            });
        ZoomMtg.showInviteFunction({
            show: false
        });
  });
};


// Other socket.io session events

socket.on('room_join_event', function(obj){
      console.log(obj['users_in_room']);
      users_in_room = obj['users_in_room'].slice();
      console.log(obj['message']);
      if (users_in_room.length > 1) {
        modal_append(users_in_room[users_in_room.length - 1]);
      }

       //emits a socket event that adds the new user
      console.log(user_devices);
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
