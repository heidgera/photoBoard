var sharp = require('sharp');

require('./src/gallery.js');
var fs = require('fs');

var srv = require('./src/exp_server.js');

var exec = require('child_process').exec;

var path = require('path');

const remote = require('electron').remote;

var google = require('./src/google.js');
var drive = google.drive;
var gmail = google.gmail;
var sheets = google.sheets;

var ssID = '1OE0X2Ey1nJaAAkHnJ02zntw1_uJjYR8k5EmUxZg4VI8';
var processing = false;

function getIPaddress() {
  var os = require('os');

  var addresses = '';

  var interfaces = os.networkInterfaces();
  var addresses = [];
  for (var k in interfaces) {
    for (var k2 in interfaces[k]) {
      var address = interfaces[k][k2];
      if (address.family === 'IPv4' && !address.internal) {
        //addresses.push(address.address);
        addresses += address.address + '/';
      }
    }
  }

  //cur = newPrompt(addresses);
  return addresses;
}

µ('#ip').textContent = getIPaddress();

function walkPart(part, type) {
  var ret = null;
  if (part.length) {
    /*parts.forEach(function(item, ind, arr) {
      if (ret = walkPart(item, type)) break;
    });*/
    for (var i = 0; i < part.length; i++) {
      if (ret = walkPart(part[i], type)) break;
    }
  } else if (part.mimeType && part.mimeType == type) {
    ret = part;
  }

  return ret;
}

google.onAuth = function() {
  function storeToSheets(filename, desc, from, cb) {
    sheets.getData(ssID, 'Sheet1!A2:E', function(resp) {
      //console.log(resp.values);
      var rows = resp.values;
      rows.unshift(new Array());
      rows[0][0] = filename;
      rows[0][1] = desc;
      rows[0][2] = from;
      sheets.putData(ssID, 'Sheet1!A2:E', rows, function() {
        if (cb) cb();

        µ('#main').clear();
        µ('#main').addFromArray(rows);

      });
    });
  }

  setInterval(function() {
    gmail.listMessages(['UNREAD'], 'subject:#shoppics has:attachment', function(response) {
      var msgs = response.messages;
      if (response.resultSizeEstimate == 0 || msgs.length == 0) {
        //console.log('No messages found.');
      } else if (!processing) {
        processing = true;
        msgs.forEach(function(msg, ind, arr) {
          let msgId = msg.id;
          let from = '';
          gmail.getMessage(msgId, function(resp) {
            if (resp.payload.headers) {
              let hd = resp.payload.headers;
              for (var i = 0; i < hd.length; i++) {
                if (hd[i].name == 'From') from = hd[i].value;
              }
            }

            if (resp.payload.parts) {
              var parts = resp.payload.parts;
              var desc = '';
              var descHTML = '';
              var attachBody = '';
              console.log(parts);
              parts.forEach(function(part, ind, arr) {
                if (walkPart(part, 'text/plain') && !desc.length) {
                  desc = (new Buffer(walkPart(part, 'text/plain').body.data, 'base64')).toString();
                  desc = desc.replace(/(\r\n|\n|\r)/gm, ' ');
                } else if (walkPart(part, 'text/html') && !descHTML.length) {
                  descHTML = (new Buffer(walkPart(part, 'text/html').body.data, 'base64')).toString();
                } else if (walkPart(part, 'image/jpeg')) {
                  attachPart = walkPart(part, 'image/jpeg');
                } else if (walkPart(part, 'image/gif')) {
                  attachPart = walkPart(part, 'image/gif');
                }
              });

              if (attachPart) {
                //console.log(desc);
                if (!descHTML.length) descHTML = desc;
                console.log(descHTML);
                gmail.getAttachment(msgId, attachPart.body.attachmentId, function(resp) {
                  var data = new Buffer(resp.data, 'base64');
                  var file = 'assets/photos/' + attachPart.filename;
                  if (attachPart.mimeType == 'image/jpeg' || attachPart.mimeType == 'image/png') {
                    console.log('store regular image');
                    sharp(data).resize(1920, 1080).max().rotate().toFile(file).then(function() {
                      storeToSheets(file, desc, from, ()=> {
                        gmail.editLabels(msgId, [], ['UNREAD']);
                        processing = false;
                      });
                    });
                  } else if (attachPart.mimeType == 'image/gif') {
                    console.log('store gif');
                    fs.writeFile(file, data, function(err) {
                      console.log('done storing data');
                      if (err) console.log(err);
                      storeToSheets(file, desc, from, ()=> {
                        gmail.editLabels(msgId, [], ['UNREAD']);
                        processing = false;
                      });
                    });
                  }
                });
              }

            }
          });
        });
      }
    }, ()=> {

      if (!processing) {
        processing = true;
        exec('sudo ifdown wlan0', (err, out, sterr)=> {
          if (!err) exec('sudo ifup wlan0', (err, out, sterr)=> {
            if (!err) setTimeout(()=> {processing = false;}, 2000);
          });
        });
      }
    });
  }, 6000);

  sheets.getData(ssID, 'Sheet1!A2:E', function(resp) {
    console.log(µ('#main'));
    µ('#main').addFromArray(resp.values);
  });

  document.onkeydown = function(e) {
    switch (e.which) {
      case 27:
        remote.app.quit();
        break;
      case 37:
        console.log('prev');
        µ('#main').displayPrevious(true);
        break;
      case 39:
        console.log('next');
        µ('#main').displayNext(true);
        break;
      case 32:
        if (µ('#main').className == 'select') {
          µ('#main').className = 'show';
        } else µ('#main').className = 'select';
        break;
      default:
        break;
    }
  };

  srv.app.post('/control.json', (req, res)=> {
    var ret = { rep:true };

    console.log(req);

    var obj = req.body;
    if (obj.next) µ('#main').displayNext(true);
    else if (obj.prev) µ('#main').displayPrevious(true);
    else if (obj.menu) {
      if (µ('#main').className == 'select') {
        µ('#main').className = 'show';
      } else µ('#main').className = 'select';
    }

    res.sendFile(path.resolve(__dirname + '/public/index.html'));
  });

  srv.app.post('/fileUpload', (req, res)=> {
    var ret = { rep:true };

    var desc = '';

    req.pipe(req.busboy);
    req.busboy.on('field', function(fieldname, val) {
      //console.log('Field [' + fieldname + ']: value: ' + inspect(val));
      if (fieldname = 'descText') desc = val;
    });

    req.busboy.on('file', function(fieldname, file, filename) {

      fstream = fs.createWriteStream('assets/photos/' + filename);
      fstream.on('close', function() {
        sheets.getData(ssID, 'Sheet1!A2:E', function(resp) {
          //console.log(resp.values);
          var rows = resp.values;
          rows.unshift(new Array());
          rows[0][0] = 'assets/photos/' + filename;
          rows[0][1] = desc;
          rows[0][2] = 'Uploaded';
          sheets.putData(ssID, 'Sheet1!A2:E', rows, function() {
            µ('#main').clear();
            µ('#main').addFromArray(rows);

            processing = false;

            //µ('#main').src = file;
          });
        });
      });

      var handleStream = sharp().resize(1920, 1080).max().rotate();

      file.pipe(handleStream).pipe(fstream);
    });

    /*fs.readFile(req.files.imageUpload.path, function(err, data) {
      var file = 'assets/photos/' + req.files.imageUpload.name;

    });*/

    res.sendFile(path.resolve(__dirname + '/public/index.html'));
  });

  µ('#main').displayNext();

};
