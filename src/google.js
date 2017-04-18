var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var MailComposer = require('nodemailer/lib/mail-composer');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/drive-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/drive',
              'https://www.googleapis.com/auth/gmail.modify',
              'https://www.googleapis.com/auth/spreadsheets',
             ];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'shop-drive+sheets+gmail.json';

oauth2Client = null;

var gmail = null;
var drive = null;
var sheets = null;

// Drive exports
exports.drive = {};
exports.gmail = {};
exports.sheets = {};

exports.onAuth = function() {};

/*exports.drive.listFiles = exports.drive.uploadJpg = function() {
  console.log('Authenticate First!');
};

// Gmail exports

exports.gmail.listMessages = exports.gmail.getMessage = exports.gmail.getAttachment = exports.gmail.editLabels = function() {
  console.log('Authenticate First!');
};*/

// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }

  console.log('Begin authorization');
  authorize(JSON.parse(content), function(auth) {
    console.log('Authorized');
    init(auth);
    exports.onAuth();
  });

});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }

      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }

  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

function init(auth) {
  console.log('init the functions');
  var oauth2 = auth;
  gmail = google.gmail({ version: 'v1', auth: oauth2 });
  drive = google.drive({ version: 'v3', auth: oauth2 });
  sheets = google.sheets({ version: 'v4', auth: oauth2 });

  exports.drive.listFiles = function(prm, cb) {
    if (!prm.pageToken) prm.pageToken = '';
    if (!prm.orderBy) prm.orderBy = 'name desc';
    if (!prm.pageSize) prm.pageSize = 10;
    if (!prm.fields) prm.fields = 'nextPageToken, files(id, name, webContentLink, fileExtension, description, thumbnailLink)';

    drive.files.list({
      pageSize: prm.pageSize,
      fields: prm.fields,
      pageToken: prm.pageToken,
      orderBy: prm.orderBy,
      q: prm.queryString,
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }

      cb(response);
    });

  };

  exports.drive.uploadFile = function(params, cb) {
    var fileMetadata = {
      name: params.title,
      parents: params.parents,
      description: params.description,
    };
    var media = {
      mimeType: params.type,
      body: params.data,
    };
    drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    }, function(err, file) {
      if (err) {
        // Handle error
        console.log(err);
      } else {
        console.log('File Id: ', file.id);

        cb(file);
      }
    });
  };

  //sheets exports

  exports.sheets.putData = function(ssID, dataRange, dataArray, cb) {
    sheets.spreadsheets.values.update({
      spreadsheetId: ssID,
      range: dataRange,
      valueInputOption: 'USER_ENTERED',
      resource: { range: dataRange,
          majorDimension: 'ROWS',
          values: dataArray, },
    }, function(err, resp)  {

      if (err) {
        console.log('Data Error :', err);
      }

      if (cb) cb(resp);

    });
  };

  exports.sheets.getData = function(ssID, dataRange, cb) {
    sheets.spreadsheets.values.get({
      spreadsheetId: ssID,
      range: dataRange,
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }

      cb(response);
    });
  };

  //gmail exports

  exports.gmail.listMessages = function(labels, queryString, cb, errCB) {
    gmail.users.messages.list({
      userId: 'me',
      labelIds: labels,
      q: queryString,
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        if (errCB) errCB();
        return;
      }

      cb(response);
    });
  };

  exports.gmail.getMessage = function(msgId, cb) {
    gmail.users.messages.get({
      userId: 'me',
      id: msgId,
    }, function(err, resp) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }

      cb(resp);
    });
  };

  exports.gmail.sendMessage = function(from, rcpt, subj, body, cb) {
    var mail = new MailComposer({
      from: from, // sender address
      to: rcpt, // list of receivers
      subject: subj, // Subject line
      text: body, // plaintext body
    });

    mail.compile().build(function(err, message) {
      console.log(message.toString());
      var b64 = message.toString('base64');

      gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: b64,
        },
      }, function(err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          return;
        }

        if (cb) cb(response);
      });
    });
  };

  exports.gmail.getAttachment = function(msgId, attachmentId, cb) {
    gmail.users.messages.attachments.get({
      userId: 'me',
      id: attachmentId,
      messageId: msgId,
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }

      cb(response);
    });
  };

  exports.gmail.editLabels = function(msgId, labelsToAdd, labelsToRemove, cb) {
    gmail.users.messages.modify({
      userId: 'me',
      id: msgId,
      resource:{
        addLabelIds: labelsToAdd,
        removeLabelIds: labelsToRemove,
      },
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }

      if (cb) cb(response);
    });
  };
}
