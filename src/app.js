var sharp = require('sharp');

require('./src/gallery.js');

var google = require('./src/google.js');
var drive = google.drive;
var gmail = google.gmail;
var sheets = google.sheets;

var ssID = '1OE0X2Ey1nJaAAkHnJ02zntw1_uJjYR8k5EmUxZg4VI8';

google.onAuth = function() {
  setInterval(function() {
    gmail.listMessages(['UNREAD'], 'subject:#shoppics has:attachment', function(response) {
      var msgs = response.messages;
      if (response.resultSizeEstimate == 0 || msgs.length == 0) {
        //console.log('No messages found.');
      } else {
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
              parts.forEach(function(part, ind, arr) {
                if (ind == 0) {
                  desc = (new Buffer(part.parts[0].body.data, 'base64')).toString();
                  desc = desc.replace(/(\r\n|\n|\r)/gm, ' ');
                  console.log(desc);
                } else if (part.mimeType && part.mimeType == 'image/jpeg') {
                  gmail.getAttachment(msgId, part.body.attachmentId, function(resp) {
                    var data = new Buffer(resp.data, 'base64');
                    var file = 'assets/photos/' + part.filename;
                    sharp(data).resize(1920, 1080).max().toFile(file).then(function() {
                      sheets.getData(ssID, 'Sheet1!A2:E', function(resp) {
                        //console.log(resp.values);
                        var rows = resp.values;
                        rows.unshift(new Array());
                        rows[0][0] = file;
                        rows[0][1] = desc;
                        rows[0][2] = from;
                        sheets.putData(ssID, 'Sheet1!A2:E', rows, function() {
                          gmail.editLabels(msgId, [], ['UNREAD']);
                          µ('#main').clear();
                          µ('#main').addFromArray(rows);

                          //µ('#main').src = file;
                        });
                      });
                    });
                  });
                }
              });
            }
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

  /*photoRoute.post('/pictures.json', function(req, res) {
    var obj = req.body;
    var ret = {};
    ret.photos = [];

    let params = {
      queryString: "'0B1F7mIkYmh6nVEdVVUZ6OUpWTmc' in parents",
      orderBy: 'name desc',
    };

    if (obj.pageToken && obj.pageToken.length) params.pageToken = obj.pageToken;

    //babyTime.sendTimeSinceLast(res);
    drive.listFiles(params, function(resp) {
      var files = resp.files;
      ret.pageToken = resp.nextPageToken;
      if (files.length == 0) {
        console.log('No files found.');
      } else {
        for (var i = 0; i < files.length; i++) {
          if (files[i].fileExtension == 'jpg') {
            var desc = files[i].description;
            if (desc) desc = desc.replace(/(\r\n|\n|\r)/gm, ' ');
            ret.photos.push({ description: desc, thumb:files[i].thumbnailLink, link: 'https://drive.google.com/uc?export=view&id=' + files[i].id });

            //console.log('Link: https://drive.google.com/uc?export=view&id=' + file.id);
          }
        }
      }

      res.json(ret);
    });
  });*/
};
