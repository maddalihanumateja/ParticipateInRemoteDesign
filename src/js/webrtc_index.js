import css from '../css/style.scss';
import { v4 as uuidv4 } from 'uuid';
import querystring from 'querystring'

//Hide the zoom meeting window
$('#mtg-root').hide();
$('#researcher_side_form').hide();
$('#participant_side_form').hide();

//Initialize random meeting UUID
document.getElementById('meeting_name').value = uuidv4();

var ip_address="0.0.0.0";
$.get('https://api.ipify.org?format=json', function(data, status) {
    ip_address = data.ip;
});

//When you click on the participant side hide the researcher side and display the participant's options
document.getElementById('participant_side').addEventListener('click', (e) => {

    if($('#participant_side').hasClass("selected-user-type")){
        return;
    }

    $('#participant_side').addClass("col-md-8 order-first selected-user-type");
    $('#participant_side').removeClass("col-md-6 col-md-2");
    $('#participant_side').children().show();
    $('#participant_side_init_message').hide();
    if($('#participant_side_init_title').hasClass("h4")){
        $('#participant_side_init_title').toggleClass("h1 h4");
    }
    
    $('#researcher_side').removeClass("col-md-6 col-md-8 order-first selected-user-type");
    $('#researcher_side').addClass("col-md-2");
    $('#researcher_side').children().hide();
    $('#researcher_side_init_text').show();
    $('#researcher_side_init_message').show();
    if($('#researcher_side_init_title').hasClass("h1")){
        $('#researcher_side_init_title').toggleClass("h1 h4");
    }

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
                button.innerHTML = `Click here to join meeting "${data[i].meeting_name}"`;
                button.classList.add('btn','btn-primary');
                button.setAttribute("id","pjoin_mtg_"+(i+1));
                var meetConfig_i = {
                        meetingName: data[i].meeting_name,
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
                        if(meetConfig_i["userName"].length == 0){
                            alert("Please enter a user name.");
                            return null;
                        }
                        else{
                            initialize_button_click(meetConfig_i);    
                        }
                        
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

    if($('#researcher_side').hasClass("selected-user-type")){
        return;
    }

    $('#researcher_side').addClass("col-md-8 order-first selected-user-type");
    $('#researcher_side').removeClass("col-md-6 col-md-2");
    $('#researcher_side').children().show();
    $('#researcher_side_init_message').hide();
    if($('#researcher_side_init_title').hasClass("h4")){
        $('#researcher_side_init_title').toggleClass("h1 h4");
    }
    
    $('#participant_side').removeClass("col-md-6 col-md-8 order-first selected-user-type");
    $('#participant_side').addClass("col-md-2");
    $('#participant_side').children().hide();
    $('#participant_side_init_text').show();
    $('#participant_side_init_message').show();
    if($('#participant_side_init_title').hasClass("h1")){
        $('#participant_side_init_title').toggleClass("h1 h4");
    }

    $.get("/meeting_active_logs", function(data, status){
        if(data.length==0){
            $('#researcher_side_meetings').html('<h3>No Active Meetings Found</h3>');
        }
        else{
            $('#researcher_side_meetings').html('<h4>'+data.length+' Active Meetings Found.<br><br>You can join these as an audience member.</h4>');
            $('#researcher_meeting_buttons').html("");
            for(var i=0;i<data.length;i++){
                var button = document.createElement("button");
                button.innerHTML = `Click here to join meeting "${data[i].meeting_name}"`;
                button.classList.add('btn','btn-primary');
                button.setAttribute("id","rjoin_mtg_"+(i+1));
                var meetConfig_i = {
                        meetingName: data[i].meeting_name,
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
                        if(meetConfig_i["userName"].length == 0){
                            alert("Please enter a user name.");
                            return null;
                        }
                        else{
                            initialize_button_click(meetConfig_i);    
                        }
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

    var meetConfig = {
        meetingName: document.getElementById('meeting_name').value,
        userName: document.getElementById('display_name').value,
        userEmail: document.getElementById('display_email').value,
        passWord: document.getElementById('meeting_password').value,
        user_type: 'researcher',
        leaveUrl: 'https://zoom.us',
        ip_address: ip_address,
        role: 1
    };

    //Check if meeting name already exists and is active

    $.get("/meeting_active_logs", function(data, status){
        if(data.length>0){
            for(var i=0;i<data.length;i++){
                if(meetConfig.meeting_name == data[i].meeting_name){
                    alert("Meeting name already exists for an active meeting. Please type another meeting name (or join the active meeting with the same name).");
                    return null;
                }
            }
        }

        initialize_button_click(meetConfig);

    });
});

var initialize_button_click = (meetConfig) => {

    fetch('/webrtc_sign', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(meetConfig)
    }).then((response) => {
        return response.json();
    })
    .then((data) => {
        //Go to the room with the assigned meetingName. Set user room here. Create meeting logs.
        if(meetConfig.meetingName){
            //Known meeting number
            var meeting_name = meetConfig.meetingName;
        }
        else{
            // Meeting room created just now with webrtc_sign if user left it blank
            var meeting_name = data.meetingName;
        }

            alert("Join meeting?");

        /*fetch('/room_create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({meeting_name: meeting_name,
                meeting_password: meetConfig.passWord,
                user_name: meetConfig.userName,
                email: meetConfig.userEmail,
                ip_address: meetConfig.ip_address,
                user_type: meetConfig.user_type,
                meeting_host: meetConfig.role = 1 ? true:false})
        });*/
        return {meeting_name: meeting_name,
                meeting_password: meetConfig.passWord,
                user_name: meetConfig.userName,
                user_type: meetConfig.user_type,
                meeting_host: meetConfig.role = 1 ? true:false};

  }).then((data)=>{
    window.location.href = '/room?'+querystring.stringify(data);
  });
};


