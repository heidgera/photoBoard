'use strict';

var remote = require('electron').remote;

var process = remote.process;

//remote.getCurrentWindow().closeDevTools();

window.appDataDir = '/Users/aheidgerken';

var obtains = [
  'µ/google/',
  '../piFig/src/utils.js',
  './src/server/express.js',
  'path',
  './src/gallery.js',
  'sharp',
];

obtain(obtains, ({ sheets, drive, gmail, auth }, { getIpAddress }, { fileServer: srv, router }, path, gallery, sharp)=> {

  exports.app = {};

  var ssID = '1OE0X2Ey1nJaAAkHnJ02zntw1_uJjYR8k5EmUxZg4VI8';
  var processing = false;

  exports.app.start = ()=> {
    console.log('started');

    µ('#ip').textContent = getIpAddress();

    function storeToSheets(filename, desc, from, cb) {
      sheets.getData(ssID, 'Sheet1!A2:E', function (resp) {
        //console.log(resp.values);
        var rows = resp.values;
        rows.unshift(new Array());
        rows[0][0] = filename;
        rows[0][1] = desc;
        rows[0][2] = from;
        sheets.putData(ssID, 'Sheet1!A2:E', rows, function () {
          if (cb) cb();

          µ('#main').clear();
          µ('#main').addFromArray(rows);

        });
      });
    }

    function walkPart(part, type) {
      var ret = null;
      if (part.length) {
        for (var i = 0; i < part.length; i++) {
          if (ret = walkPart(part[i], type)) break;
        }
      } else if (part.mimeType && part.mimeType == type) {
        ret = part;
      }

      return ret;
    }

    setInterval(function () {
      gmail.listMessages({
        labels: [],
        queryString: 'subject:#shoppics has:attachment is:unread',
      }, function (response) {
        var msgs = response.messages;
        if (response.resultSizeEstimate == 0 || msgs.length == 0) {
          //console.log('No messages found.');
        } else if (!processing) {
          processing = true;
          msgs.forEach(function (msg, ind, arr) {
            console.log(msg.id);
            let msgId = msg.id;
            let from = '';
            gmail.getMessage(msgId, function (resp) {
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
                var attachPart = null;
                parts.forEach(function (part, ind, arr) {
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
                  gmail.getAttachment(msgId, attachPart.body.attachmentId, function (resp) {
                    var data = new Buffer(resp.data, 'base64');
                    var file = __dirname + '/../assets/photos/' + attachPart.filename;
                    if (attachPart.mimeType == 'image/jpeg' || attachPart.mimeType == 'image/png') {
                      console.log('store regular image');
                      console.log(sharp);
                      sharp(data).resize(1920, 1080).max().rotate().toFile(file).then(function () {
                        storeToSheets(file, desc, from, ()=> {
                          gmail.editLabels(msgId, [], ['UNREAD']);
                          processing = false;
                        });
                      });
                    } else if (attachPart.mimeType == 'image/gif') {
                      console.log('store gif');
                      fs.writeFile(file, data, function (err) {
                        console.log('done storing data');
                        if (err) console.log(err);
                        storeToSheets(file, desc, from, ()=> {
                          gmail.editLabels(msgId, [], ['UNREAD']);
                          processing = false;
                        });
                      });
                    }
                  });
                } else processing = false;

              }
            });
          });
        }
      }, ()=> {

        if (!processing) {
          processing = true;
          /*exec('sudo ifdown wlan0', (err, out, sterr)=> {
            if (!err) exec('sudo ifup wlan0', (err, out, sterr)=> {
              if (!err) setTimeout(()=> {processing = false;}, 15000);
            });
          });*/
        }
      });
    }, 6000);

    auth.whenReady(()=> {
      sheets.getData(ssID, 'Sheet1!A2:E', function (data) {
        console.log(µ('#main'));
        µ('#main').addFromArray(data.values);
      });
    });

    document.onkeydown = function (e) {
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

    router.post('/control', (req, res)=> {
      var ret = { rep: true };

      var obj = req.body;
      if (obj.next) µ('#main').displayNext(true);
      else if (obj.prev) µ('#main').displayPrevious(true);
      else if (obj.menu) {
        if (µ('#main').className == 'select') {
          µ('#main').className = 'show';
        } else µ('#main').className = 'select';
      }

      //res.sendFile(path.resolve(__dirname + '../../../client/index.html'));
      res.json(ret);
    });

    router.post('/fileUpload', (req, res)=> {
      var ret = { rep: true };

      if (!!req.files) {
        var upload = req.files.imageUpload;
        var file = __dirname + '/../assets/photos/' + upload.name;

        if (upload.mimetype == 'image/jpeg' || upload.mimetype == 'image/png') {
          console.log('store regular image');
          sharp(upload.data).resize(1920, 1080).max().rotate().toFile(file).then(function () {
            console.log(file);
            storeToSheets(file, req.body.descText, 'upload', ()=> {
              processing = false;
              res.json({ rep: true });
            });
          });
        } else if (upload.mimetype == 'image/gif') {
          console.log('store gif');
          fs.writeFile(file, upload.data, function (err) {
            console.log('done storing data');
            if (err) console.log(err);
            storeToSheets(file, req.body.descText, 'upload', ()=> {
              processing = false;
              res.json({ rep: true });
            });
          });
        }
      } else res.json({ rep: false });
    });

    srv.start();

    µ('#main').displayNext();

    document.onkeypress = (e)=> {
      //if (e.key == ' ') console.log('Space pressed'), hardware.digitalWrite(13, 1);
    };

    document.onkeyup = (e)=> {

      if (e.which == 73 && e.getModifierState('Control') &&  e.getModifierState('Shift')) {
        remote.getCurrentWindow().toggleDevTools();
      }
    };

    process.on('SIGINT', ()=> {
      process.nextTick(function () { process.exit(0); });
    });
  };

  provide(exports);
});
