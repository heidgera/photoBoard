'use strict';

var server = require('http').createServer();
var url = require('url');

//var WebSocketServer = require('ws').Server;
//var wss = new WebSocketServer({ server: server });
var express = require('express');
var port = 8080;

var bodyParser = require('body-parser');
var busboy = require('connect-busboy');

var dirname = __dirname + '/../public';

console.log(dirname + ' is the folder');

var app = express();

app.use(bodyParser.json());
app.use(busboy());
app.use(express.static(dirname));

exports.app = app;

server.on('request', app);
server.listen(port, function() { console.log('Listening on ' + server.address().port); });
