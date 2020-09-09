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

    $.get("/meeting_active_logs", function(data, status){
        if(data.length==0){
            $('#researcher_side_meetings').html('<h3>No Active Meetings Found</h3>');
        }
        else{
            $('#researcher_side_meetings').html('<h4>'+data.length+' Active Meetings Found.<br>You can join these as an audience member.</h4>');
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
                                
                                console.log('join meeting success');
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
       //emits a socket event that adds the new user
      console.log(user_devices);
});

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
    mutations.forEach(function (mutation) {
        if (mutation.addedNodes.length) {
            var counter;  
            for (counter = 0; counter < user_devices.length; counter++) {
                /* Creates the projector button */
                let aElement = $('<li role=\'presentation\' class=\'projector\'><a role=\'menuitem\' tabindex=\'-1\' href\'#\'>Projector</a></li>');
                let bElement = $('<li role=\'presentation\' class=\'printer\'><a role=\'menuitem\' tabindex=\'-1\' href\'#\'>Printer</a></li>');
                
                let name = user_devices[counter].username;
                name += "  computer audio muted video off     ";
                let node = document.querySelector('[aria-label=\'' + name + '\']');
                
                $(aElement).attr( {
                    id: counter
                });

                $(bElement).attr({
                    id: counter + 100
                })

                /* Appends the buttons conditionally */

                if (user_devices[counter].devices === 1) {
                    $(aElement).appendTo(node.children[1].children[0].children[1].children[1]);
                } else if (user_devices[counter].devices === 2) {
                    $(bElement).appendTo(node.children[1].children[0].children[1].children[1]);
                } else if (user_devices[counter].devices === 3) {
                    $(aElement).appendTo(node.children[1].children[0].children[1].children[1]);
                    $(bElement).appendTo(node.children[1].children[0].children[1].children[1]);
                }
            }

            $('.projector').on('click', function() {
                let pid = $(this).attr('id');
                let obj = {'to_username': users_in_room[parseInt(pid)], 'message':'projector do something', 'room': parseInt(document.getElementById('meeting_number').value, 10)};
                researcher_trigger_event(obj);
            });

            $('.printer').on('click', function() {
                let pid = $(this).attr('id');
                document.getElementById('file-input').click();
                pid -= 100;

                const formData = new FormData();
                const inpFile = document.getElementById('file-input');

                inpFile.addEventListener("change", function() {
                    formData.append("inpFile", inpFile.files[0]);

                    // console.log(formData);

                    fetch('/print', {
                        method: 'POST',
                        body: JSON.stringify({
                            form: formData,
                            user_data: user_devices[pid]
                        }),
                        }).then((response) => {
                        return response.json();
                    }).then((data) => {console.log(data)})
                    .catch(error => {
                        console.error(error);
                    })
                });

                // console.log(file_path);
                
                

                /* let pid = $(this).attr('id');
                let obj = {'to_username': users_in_room[parseInt(pid) - 100], 'message':'printer do something', 'room': parseInt(document.getElementById('meeting_number').value, 10)};
                researcher_trigger_event(obj); */
            });
        }
    });
});

var observerConfig = {
    childList: true
};

