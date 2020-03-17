import { ZoomMtg } from '@zoomus/websdk';

console.log('checkSystemRequirements');
console.log(JSON.stringify(ZoomMtg.checkSystemRequirements()));

// it's option if you want to change the WebSDK dependency link resources. setZoomJSLib must be run at first
//ZoomMtg.setZoomJSLib('https://source.zoom.us/1.7.2/lib', '/av'); // CDN version default
// else ZoomMtg.setZoomJSLib('https://jssdk.zoomus.cn/1.7.2/lib', '/av'); // china cdn option 
// ZoomMtg.setZoomJSLib('http://localhost:9999/node_modules/@zoomus/websdk/dist/lib', '/av'); // Local version default, Angular Project change to use cdn version
ZoomMtg.preLoadWasm();
ZoomMtg.prepareJssdk();

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
                                $('#nav-tool').hide();
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
                                $('#nav-tool').hide();
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
