'use strict';

window.µ = function(id, elem) {
  var ret;
  var root = ((elem) ? elem : document);
  var spl = id.split('>');
  switch (spl[0].charAt(0)) {
    case '|':
      ret = root;
      break;
    case '+':
      ret = document.createElement(spl[0].substring(1));
      if (elem) elem.appendChild(ret);
      break;
    case '#':
      ret = root.querySelector(spl[0]);
      break;
    default:
      ret = root.querySelectorAll(spl[0]);

      //if(ret.length==1) ret = ret[0];
      //else{
      ret.forEach = function(cb) {
          for (let i = 0; i < ret.length; i++) {
            cb(i, ret[i]);
          }
        };

      ret.style = function(mem, val) {
          for (let i = 0; i < ret.length; i++) {
            ret[i].style[mem] = val;
          }
        };

      //}
      break;
  }
  if (spl.length <= 1) return ret;
  else return ret.getAttribute(spl[1]);
};

window.inheritFrom = function(parent, addMethods) {
  var _parent = parent;
  var ret = function() {
    if (_parent) {
      _parent.apply(this, arguments);
    }
  };

  //console.log(_parent);

  ret.prototype = Object.create(_parent && _parent.prototype, {
    constructor: {
      value: ret,
      enumerable: false,
      writable: true,
      configurable: true,
    },
  });
  if (_parent) ret.__proto__ = _parent;

  if (typeof addMethods === 'function')
    addMethods.call(ret.prototype);

  return ret;
};

Function.prototype.inherits = function(parent) {
  this.prototype = Object.create(parent && parent.prototype, {
    constructor: {
      value: this,
      enumerable: false,
      writable: true,
      configurable: true,
    },
  });
  if (parent) this.__proto__ = parent;
};

function ajax(src, fxn) {
  var http = new XMLHttpRequest();
  var ret = 0;

  http.open('get', src);
  http.responseType = 'document';
  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      ret = http.responseXML;
      fxn(ret);
    }
  };

  http.send(null);

  return ret;
}

window.get = function(url) {
  // Return a new promise.
  return new Promise(function(resolve, reject) {
    // Do the usual XHR stuff
    var req = new XMLHttpRequest();
    req.open('GET', url);

    req.onload = function() {
      // This is called even on 404 etc
      // so check the status
      if (req.status == 200) {
        // Resolve the promise with the response text
        resolve(req.response);
      } else {
        // Otherwise reject with the status text
        // which will hopefully be a meaningful error
        reject(Error(req.statusText));
      }
    };

    // Handle network errors
    req.onerror = function() {
      reject(Error('Network Error'));
    };

    // Make the request
    req.send();
  });
};

window.post = function(url, obj) {
  // Return a new promise.
  return new Promise(function(resolve, reject) {
    // Do the usual XHR stuff
    var req = new XMLHttpRequest();
    req.open('POST', url);
    req.setRequestHeader('Content-type', 'application/json');

    req.onload = function() {
      // This is called even on 404 etc
      // so check the status
      if (req.status == 200) {
        // Resolve the promise with the response text
        resolve(req.response);
      } else {
        // Otherwise reject with the status text
        // which will hopefully be a meaningful error
        reject(Error(req.statusText));
      }
    };

    // Handle network errors
    req.onerror = function() {
      reject(Error('Network Error'));
    };

    // Make the request
    req.send(JSON.stringify(obj));
  });
};

function loadFile(src, Fxn) {
  var _this = this;
  var http = new XMLHttpRequest();
  _this.xml = null;

  _this.loadFxns = [];

  _this.onXMLLoad = function() {
    for (var i = 0; i < _this.loadFxns.length; i++) {
      _this.loadFxns[i]();
    }
  };

  _this.whenLoaded = function(fxn) {
    var _this = this;
    if (!_this.loaded) _this.loadFxns.push(fxn);
    else fxn();
  };

  http.open('get', src);
  http.responseType = 'document';
  http.onreadystatechange = function() {
    if (http.readyState == 4) {
      _this.xml = http.responseXML;
      Fxn(_this.xml);
    }
  };

  http.send(null);

  return this;
}

function transplant(node) {
  var temp = node.cloneNode(true);
  var par = node.parentElement;
  par.insertBefore(temp, node);
  par.removeChild(node);

  return temp;
}

/***************************************
these work like this:

For custom elements:
-----------------------------------------
var DateSpan = inheritFrom(HTMLSpanElement);

DateSpan.prototype.createdCallback = function () {
    this.textContent = 'Today's date: ' + new Date().toJSON().slice(0, 10);
  };

  document.registerElement('date-today', DateSpan);

for extending functions:
------------------------------------------
fociiActions.inherits(Array);
function fociiActions() {
  Array.apply(this,arguments);
  var self = this;
  this.addElement = function (el) {
    this.push({'elem':el,'attr':new fociiAttr()})
    return this.last().attr;
  }
  this.addFxn = function (fxn) {
    this.push(fxn);
  }
  this.addItem = function (item) {
    if(typeof item === 'function') self.addFxn(item);
    else return self.addElement(item);
  }
}
******************************************/

function b64toBlobURL(b64Data, contentType, sliceSize) {
  var parts = b64Data.match(/data:([^;]*)(;base64)?,([0-9A-Za-z+/]+)/);
  contentType = contentType || '';
  sliceSize = sliceSize || 512;

  var byteCharacters = atob(parts[3]);
  var byteArrays = [];

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize);

    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    var byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  var blob = new Blob(byteArrays, { type: contentType });
  return URL.createObjectURL(blob);
}

var revokeBlobURL = function(URL) {
  window.URL.revokeObjectURL(URL);
};

var charCode = function(string) {
  return string.charCodeAt(0);
};

function degToRad(d) {
  // Converts degrees to radians
  return d * 0.0174532925199432957;
}

function itoa(i)
{
  return String.fromCharCode(i);
}

function bitRead(num, pos) {
  return (num & Math.pow(2, pos)) >> pos;
}

function distance(p1, p2) {
  return Math.sqrt(Math.pow((p2.x - p1.x), 2) + Math.pow((p2.y - p1.y), 2));
}

Array.prototype.min = function() {
  return Math.min.apply({}, this);
};

Array.prototype.max = function() {
  return Math.max.apply({}, this);
};

Array.prototype.last = function() {
  return this[this.length - 1];
};

function getPos(el) {
  // yay readability
  for (var lx = 0, ly = 0; el != null; lx += el.offsetLeft, ly += el.offsetTop, el = el.offsetParent);
  return { x: lx, y: ly };
}

function aveCont(points) {
  if (points === undefined) points = 5;
  var samps = [];
  this.ave = 0;
  var ind = 0;
  var tot = 0;

  //for (var i = 0; i < points; i++) {
  //  samps.push(0.0);
  //}

  this.changeNumSamps = function(num) {
    samps.length = 0;

    //for (var i = 0; i < num; i++) {
    //  samps.push(0.0);
    //}
    points = num;
  };

  this.clear = function() {
    samps.length = 0;

  };

  this.addSample = function(val) {
    if (samps.length >= points) {
      tot -= samps[ind];
      samps[ind] = val;
    } else samps.push(val);
    tot += val;
    this.ave = tot / samps.length;
    ind = (ind + 1) % points;
    return this.ave;
  };

  return this;
}

function map(val, inMin, inMax, outMin, outMax) {
  return (val - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

function clamp(val, Min, Max) {
  return Math.max(Min, min(val, Max));
}

function sign(x) {
  return (x > 0) - (x < 0);
}

function zeroPad(num, size) {
  var s = num + '';
  while (s.length < size) s = '0' + s;
  return s;
}

function position(elem) {
  var offset = { x:0, y:0 };
  while (elem)
  {
    offset.x += elem.offsetLeft;
    offset.y += elem.offsetTop;
    elem = elem.offsetParent;
  }

  return offset;
}

function extractNumber(value)
{
  var n = parseInt(value);

  return n == null || isNaN(n) ? 0 : n;
}

// Reduce a fraction by finding the Greatest Common Divisor and dividing by it.
function reduce(numerator, denominator) {
  var gcd = function gcd(a, b) {
    return b ? gcd(b, a % b) : a;
  };

  gcd = gcd(numerator, denominator);
  return [numerator / gcd, denominator / gcd];
}
