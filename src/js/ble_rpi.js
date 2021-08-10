let serviceUuid = '00000001-810e-4a5b-8d75-3e5b444bc3cf';
let characteristicReadUuid = '00000002-810e-4a5b-8d75-3e5b444bc3cf';
let characteristicWriteUuid = '00000003-810e-4a5b-8d75-3e5b444bc3cf';
let characteristicNotifyUuid = '00000004-810e-4a5b-8d75-3e5b444bc3cf';
let characteristicRPCUuid = '00000005-810e-4a5b-8d75-3e5b444bc3cf';
let characteristicStatusUuid = '00000006-810e-4a5b-8d75-3e5b444bc3cf';

var customNotifyCharacteristic;
var deviceSelectBtn = document.getElementById("device-select-btn");
var bluetoothDevice;
var service;

const rpiInitEvent = new Event('rpiInitEvent');
/* Functions required to encode string data to a byte stream when transmitting using BLE
and decode bytestreams back to strings when recieving BLE data
*/

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length); // 1 bytes for each char
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

/*Functions implementing BLE GATT client functions to connect to a server advertising a particular service,
read, and write characteristics of the service on the server*/

function requestDevice() {
  console.log('Requesting any Bluetooth Device...');
  navigator.bluetooth.requestDevice({filters: [{services: [serviceUuid]}]},{name: 'rpi-gatt-server'}).then(device => {
    bluetoothDevice = device;
    bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
    console.log('Getting Service...');
  }).then( result =>{
    service = bluetoothDevice.gatt.connect().then(server => {
      return server.getPrimaryService(serviceUuid);
    });
    console.log('Obtained Service...');
  })/*.then( result => {

    console.log('Sending server url to Raspberry Pi...');
    try{
      sendAppServerUrl(service, characteristicRPCUuid, window.location.origin, ROOM_ID);
    }
    catch(error){
      console.log("Error sending the server url to the Raspberry Pi");
    }
  })*/.then( result =>{
    console.log('Initializing buttons that interact with raspberry pi');
    initRpiBLE();
  });
}

function initRpiBLE(){

    console.log('Sending username to Raspberry Pi...');
    try{
      //USER_NAME should be defined in the room.ejs view. (Or new_index.ejs or wherever the video call is displayed ...)
      sendUserName(service, characteristicRPCUuid, USER_NAME, ROOM_ID);
    }
    catch(error){
      console.log("Error sending the username to the Raspberry Pi");
    }

    try{
      console.log('Adding read, write event triggers to buttons...');
      document.getElementById("write-json-btn").addEventListener("click",function(){
        var data = document.getElementById("exampleJSON").value;
        writeCharacteristic(service, characteristicWriteUuid, data);
      });
      document.getElementById("print-file-btn").addEventListener("click",function(){
        var data = "{\"function\":\"print\", \"args\":{\"filename\":\""+document.getElementById("examplePrintFile").value+"\"}}";
        console.log(data)
        writeCharacteristic(service, characteristicRPCUuid, data);
      });
      document.getElementById("read-json-btn").addEventListener("click",function(){
        readCharacteristic(service, characteristicStatusUuid).then(value=>{
          document.getElementById("read-ble").innerHTML = value;
        });
      });  
    }catch(error){
     console.log("Error adding some click functions"); 
    }
    
    document.getElementById("connect-wifi-btn").addEventListener("click",function(){
      console.log("Fetching the names of available WiFi networks");
      readCharacteristic(service, characteristicReadUuid).then(wifi_names=>{
        var wifiList = document.getElementById("WiFiSelectOptions");
        wifiList.innerHTML = "";
        wifi_names.split(/\r?\n/).filter(function(el) { return el; }).forEach(nwk => wifiList.insertAdjacentHTML( 'beforeend', "<option>"+nwk+"</option>"))
        document.getElementById("wifi-submit-btn").addEventListener("click",function(){
          var nwkName = document.getElementById("WiFiSelectOptions").selectedOptions[0].text;
          var password = document.getElementById("inputPassword").value;
          var data = "{\"function\":\"nwkLogin\", \"args\":{\"ssid\":\""+nwkName+"\",\"psk\":\""+password+"\"}}";
          console.log("Sending an RPC to RPi to try to connect to "+nwkName);
          writeCharacteristic(service, characteristicRPCUuid, data);
        });
      });
    });
}

function onDisconnected() {
  console.log('Bluetooth Device disconnected');
  // In case we are tracking a time varying characteristic's value
  //connectDeviceAndCacheCharacteristics()
  //.catch(error => {
  //  console.log('Argh! ' + error);
  //});
}

function readCharacteristic(service, characteristicUuid){
  return service.then(service => {
    console.log('Reading Characteristic...');
    return service.getCharacteristic(characteristicUuid);
  })
  .then(characteristic => {
    console.log(characteristic);
    console.log("Decoding characteristic");
    return characteristic.readValue().then(result => {
      //console.log(result.buffer)
      return ab2str(result.buffer)
    });
  })
  .then(value => {
    console.log(value)
    return value
  })
  .catch(error => {
    console.log('Argh! ' + error);
  });
}

//Example json to send : {"function":"hello","arg1":"world"}

function writeCharacteristic(service, characteristicUuid, data){
  service.then(service => {
    console.log('Writing Characteristic...');
    return service.getCharacteristic(characteristicUuid);
  })
  .then(characteristic => {
    var writeJSON = data;
    characteristic.writeValue(str2ab(writeJSON));
  })
  .catch(error => {
    console.log('Argh! ' + error);
    console.log('Was trying to send '+ data +' to '+characteristicUuid);
  });
}

function sendUserName(service, characteristicRPCUuid, userName, room){
  var data = "{\"function\":\"setUserName\", \"args\":{\"userName\":\""+userName+"\", \"room\":\""+room+"\", \"serverUrl\":\""+ window.location.origin+"\"}}";
  console.log(data)
  writeCharacteristic(service, characteristicRPCUuid, data);
}

function sendAppServerUrl(service, characteristicRPCUuid, serverUrl, room){
  var data = "{\"function\":\"setAppServerUrl\", \"args\":{\"serverUrl\":\""+serverUrl+"\", \"room\":\""+room+"\"}}";
  console.log(data)
  writeCharacteristic(service, characteristicRPCUuid, data);
}

try{
  deviceSelectBtn.addEventListener("click", requestDevice);
  document.addEventListener("rpiInitEvent", initRpiBLE);
}
catch(error){
  console.log('RPi selection button not present in researcher view.');
}
/*
//Helper functions to recieve notifications on a characteristic that is time-varying
// GATT server sends an event everytime the characteristic changes.
// The client handles these events by printing the current value to the console

function handleCustomNotifyValueChanged(){
  let notifyValue = event.target.value.getUint8(0);
  console.log('Notify Value is ' + notifyValue);
}

function connectDeviceAndCacheCharacteristics() {
  if (bluetoothDevice.gatt.connected && customNotifyCharacteristic) {
    return Promise.resolve();
  }

  console.log('Connecting to GATT Server...');
  return bluetoothDevice.gatt.connect()
  .then(server => {
    console.log('Getting customNotifyService...');
    return server.getPrimaryService(serviceUuid);
  })
  .then(service => {
    console.log('Getting customNotifyCharacteristic...');
    return service.getCharacteristic(characteristicNotifyUuid);
  })
  .then(characteristic => {
    customNotifyCharacteristic = characteristic;
    customNotifyCharacteristic.addEventListener('characteristicvaluechanged',
        handleCustomNotifyValueChanged);
  });
}*/
