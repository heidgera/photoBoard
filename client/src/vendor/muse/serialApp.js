/*********************************************************
/ You should not have to edit below this point
/*********************************************************/

var sp = null;

var com = require('serialport');
var bufSize = 512;

function openBackend(portName) {
  console.log('Opening serialport ' + portName);
  var ser = new com.SerialPort(portName, {
    baudrate: 115200,
    parser: com.parsers.readline('\r\n','binary'),
    buffersize:bufSize
  });

  ser.on('open',function() {
    sp=ser;
    if(webSock) webSock.send("sp=ack");
    sp.on('data', function(data) {
      if(webSock) webSock.send(data);
    });

  });

  ser.on('error', function(){
    console.log("Error from SerialPort");
    sp = null;
    if(webSock) webSock.send("sp=err");
  });
}

function openSerial(portName) {
  if(portName[0]!='/')
    com.list(function (err, ports) {
      ports.forEach(function(port) {
        if(port.comName.indexOf(portName)>-1){
          portName=port.comName;
          openBackend(portName);
        }
      });
    });
  else openBackend(portName);
}

/*******************************************
// For websockets, require 'ws'.Server
********************************************/


var WebSocketServer = require('ws').Server, wss = new WebSocketServer({port: 8080});

//Tell the wsServer what to do on connnection to a client;

var webSock = null;

wss.on('connection', function(ws) {

  webSock = ws;
       console.log("connected");

    ws.on('message', function(message) {
      var spl = message.split("|");
      switch(spl[0]){
        case "sp":
            if(!sp||!sp.isOpen()){
              openSerial(spl[1]);
            }
          break;
        case"r":
          console.log(spl[1].charCodeAt(0));
          if(sp) sp.write(spl[1]+"|");
          break;
        }
    });

  ws.on('close',function(){
    console.log("disconnected");
    webSock=null;

    if(sp) sp.close();
  });

  ws.on('error',function(error){
    webSock=null;
    console.log("Error: "+error);
  });

});

//////////////////////////////////////////
