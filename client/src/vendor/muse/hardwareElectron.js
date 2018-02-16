'use strict';

var Arduino = require('./Arduino.js').arduino;

////////////////////////////////////////////////
//  custom elements
////////////////////////////////////////////////

// create the elements used for hardware input

var inPut = inheritFrom(HTMLElement, function() {

  //default
  this.onData = function(val) {
    console.log('Handler function not yet initialized');
  };

  this.read = function() {
    var p = this.parentElement.arduino;
    if (p.ready) {
      if (this.type == 'analog') p.analogRead(this.pin);
      else p.digitalRead(this.pin);
    }
  };

  this.createdCallback = function() {
    //grab the type and pin attributes
    this.type = this.getAttribute('type');
    this.pin = this.getAttribute('pin');
    if (this.type == 'analog') {
      this.raw = 0;
      this.min = this.getAttribute('low');
      this.max = this.getAttribute('hi');
      this.report = parseInt(this.getAttribute('report'));
      var result = this.getAttribute('result');
      if (result && result.length > 1) {
        result = result.split('.');
        this.target = document.querySelector(result[0]);
        this.which = result[1];
      }
    } else if (this.type == 'digital') {
      var result = this.getAttribute('result');
      if (result) {
        result = result.split('.');
        this.target = document.querySelector(result[0]);
        this.which = result[1];
      }

      this.debounce = 0;
      this.hit = false;
      var temp = this.getAttribute('debounce');
      if (temp) this.debounce = parseInt(temp);
    }
  };
});

document.registerElement('in-put', inPut);

// create the elements used for hardware output

var outPut = inheritFrom(HTMLElement, function() {
  this.mode = true;
  this.state = 0;

  this.write = function(val) {
    this.state = val;
    if (this.mode) this.parentElement.arduino.analogWrite(this.pin, val);
    else this.parentElement.arduino.digitalWrite(this.pin, val);
  };

  this.createdCallback = function() {
    this.type = this.getAttribute('type');
    this.pin = this.getAttribute('pin');
    this.mode = (this.type == 'analog');
  };
});

document.registerElement('out-put', outPut);

/////////////////////////////////////////////////////////////
// create the hard-ware tag. inherit the functions from the arduino,
// in order to send the control information to the arduino.
/////////////////////////////////////////////////////////////

var hardWare = inheritFrom(HTMLElement, function() {

  this.onConnect = function() {};

  this.init = function() {
    console.log('initializing hardware...');
    var _this = this;
    this.ready = true;
    this.onReady();
    var inputs = [].slice.call(this.querySelectorAll('in-put'));
    inputs.forEach(function(item, i, arr) {
      if (item.type === 'analog') {
        //create the handler function to parse the data
        function handle(pin, val) {
          item.raw = val;
          if (item.min && item.max) val = map(val, item.min, item.max, 0, 1);
          if (!item.target) item.onData(val);
          else item.target[item.which](val);
        }

        //if the pin is set to report, init the report, otherwise, set the handler
        if (item.report) _this.arduino.analogReport(item.pin, item.report, handle);
        else _this.arduino.setHandler(item.pin, handle);

      } else if (item.type === 'digital') {
        _this.arduino.watchPin(item.pin, function(pin, val) {
          if (!item.hit) {
            if (!item.target) item.onData(val);
            else item.target[item.which](val);

            item.hit = true;
            item.dbTimer = setTimeout(function() {item.hit = false; }, item.debounce);
          }
        });
      }
    });
  };

  this.begin = function(noPortCB) {
    var _this = this;
    _this.arduino.serial.onPortNotFound = noPortCB;
    _this.arduino.connect(_this.port, ()=> {
      //_this.onReady();
      _this.init();
    });
  };

  this.createdCallback = function() {
    var _this = this;

    _this.onReady = () => {};

    _this.port = this.getAttribute('serialport');
    _this.arduino = new Arduino();
  };

  this.attachedCallback = function() {
    var _this = this;
  };
});

document.registerElement('hard-ware', hardWare);
