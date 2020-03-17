import { ZoomMtg } from '@zoomus/websdk';
import css from '../css/style.scss';

console.log('checkSystemRequirements');
console.log(JSON.stringify(ZoomMtg.checkSystemRequirements()));

// it's option if you want to change the WebSDK dependency link resources. setZoomJSLib must be run at first
//ZoomMtg.setZoomJSLib('https://source.zoom.us/1.7.2/lib', '/av'); // CDN version default
// else ZoomMtg.setZoomJSLib('https://jssdk.zoomus.cn/1.7.2/lib', '/av'); // china cdn option 
// ZoomMtg.setZoomJSLib('http://localhost:9999/node_modules/@zoomus/websdk/dist/lib', '/av'); // Local version default, Angular Project change to use cdn version
ZoomMtg.preLoadWasm();
ZoomMtg.prepareJssdk();

//Hide the zoom meeting window
$('#zmmtg-root').hide();
$('#researcher_side_form').hide();


//When you click on the participant side hide the researcher side and display the participant's options
document.getElementById('participant_side').addEventListener('click', (e) => {
    
    $('#researcher_side').hide(400);
    $('#participant_side_init_message').hide();

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

    // Note: Get meetConfig from the server. Search for available (running) meetings in a meetings table. 
    // The meetings list should be updated whenever the researcher starts a meeting.
    // Display how many meetings are currently available for the participant. 
    // Ask for the participant's name (Or, for example, let them choose from a list of avatars/nicknames if they can't write their name for some reason).
    // Update user logs if starting the meeting is successful (meeting number, user-name (manually entered or chosen automatically), i.p. address, join meeting time, researcher?, leave meeting time)

});

document.getElementById('join_meeting').addEventListener('click', (e) => {
    e.preventDefault();

    const meetConfig = {
        meetingNumber: parseInt(document.getElementById('meeting_number').value, 10),
        userName: document.getElementById('display_name').value,
        userEmail: document.getElementById('display_email').value,
        passWord: document.getElementById('meeting_password').value,
        leaveUrl: 'https://zoom.us',
        role: 0
    };

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
                                console.log('join meeting success');
                            },
                            error: (error) => {
                                console.log(error);
                            }
                        }
                    );
                },
                error(res) {
                    console.log(res);
                }
            });
  });
});

document.getElementById('start_meeting').addEventListener('click', (e) => {
    e.preventDefault();

    const meetConfig = {
        meetingNumber: parseInt(document.getElementById('meeting_number').value, 10),
        userName: document.getElementById('display_name').value,
        userEmail: document.getElementById('display_email').value,
        passWord: document.getElementById('meeting_password').value,
        leaveUrl: 'https://zoom.us',
        role: 1
    };

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
                                console.log('join meeting success');
                            },
                            error: (error) => {
                                console.log(error);
                            }
                        }
                    );
                },
                error(res) {
                    console.log(res);
                }
            });
  });
});
