'use strict';

var google = require('./src/google.js');

google.onAuth = ()=> {
  console.log('authed!');
};
