import { ZoomMtg } from '@zoomus/websdk';
/*
import {React} from 'react';
import {ReactDom} from 'react-dom';
import {Redux} from 'redux';
import {ReduxThunk} from 'redux-thunk';
import {_} from 'lodash';
import {$} from 'jquery';
*/

console.log('checkSystemRequirements');
console.log(JSON.stringify(ZoomMtg.checkSystemRequirements()));

// it's option if you want to change the WebSDK dependency link resources. setZoomJSLib must be run at first
// if (!china) ZoomMtg.setZoomJSLib('https://source.zoom.us/1.7.2/lib', '/av'); // CDN version default
// else ZoomMtg.setZoomJSLib('https://jssdk.zoomus.cn/1.7.2/lib', '/av'); // china cdn option 
// ZoomMtg.setZoomJSLib('http://localhost:9999/node_modules/@zoomus/websdk/dist/lib', '/av'); // Local version default, Angular Project change to use cdn version
ZoomMtg.preLoadWasm();
ZoomMtg.prepareJssdk();

document.getElementById('join_meeting').addEventListener('click', (e) => {
    e.preventDefault();

    const meetConfig = {
        meetingNumber: parseInt(document.getElementById('meeting_number').value, 10),
        userName: document.getElementById('display_name').value,
        passWord: document.getElementById('meeting_password').value,
        leaveUrl: 'https://zoom.us',
        role: 0
    };

    ZoomMtg.generateSignature({
        meetingNumber: meetConfig.meetingNumber,
        apiKey: process.env.API_KEY,
        apiSecret: process.env.API_SECRET,
        role: meetConfig.role,
        success(res) {
            console.log('signature', res.result);
            ZoomMtg.init({
                leaveUrl: 'http://www.zoom.us',
                success() {
                    ZoomMtg.join(
                        {
                            meetingNumber: meetConfig.meetingNumber,
                            userName: meetConfig.userName,
                            signature: res.result,
                            apiKey: process.env.API_KEY,
                            userEmail: 'email@gmail.com',
                            passWord: meetConfig.passWord,
                            success() {
                                $('#nav-tool').hide();
                                console.log('join meeting success');
                            },
                            error(res) {
                                console.log(res);
                            }
                        }
                    );
                },
                error(res) {
                    console.log(res);
                }
            });
        }
    });
});

document.getElementById('start_meeting').addEventListener('click', (e) => {
    e.preventDefault();

    const meetConfig = {
        meetingNumber: parseInt(document.getElementById('meeting_number').value, 10),
        userName: document.getElementById('display_name').value,
        passWord: document.getElementById('meeting_password').value,
        leaveUrl: 'https://zoom.us',
        role: 1
    };

    ZoomMtg.generateSignature({
        meetingNumber: meetConfig.meetingNumber,
        apiKey: process.env.API_KEY,
        apiSecret: process.env.API_SECRET,
        role: meetConfig.role,
        success(res) {
            console.log('signature', res.result);
            ZoomMtg.init({
                leaveUrl: 'http://www.zoom.us',
                success() {
                    ZoomMtg.join(
                        {
                            meetingNumber: meetConfig.meetingNumber,
                            userName: meetConfig.userName,
                            signature: res.result,
                            apiKey: process.env.API_KEY,
                            userEmail: 'email@gmail.com',
                            passWord: meetConfig.passWord,
                            success() {
                                $('#nav-tool').hide();
                                console.log('join meeting success');
                            },
                            error(res) {
                                console.log(res);
                            }
                        }
                    );
                },
                error(res) {
                    console.log(res);
                }
            });
        }
    });
});
