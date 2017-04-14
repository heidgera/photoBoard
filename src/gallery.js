'use strict';

require('./vendor/muse/utils.js');

var gallery = inheritFrom(HTMLElement, function() {
  this.createdCallback = function() {
    var _this = this;

    _this.selected = null;

    _this.advanceTimer = null;

    _this.atEnd = true;

    _this.thumbs = µ('+div', _this);
    _this.thumbs.className = 'thumbs';

    _this.display = µ('+div', _this);
    _this.display.className = 'display';

    _this.frame = µ('+img', _this.display);
    _this.frame.onclick = (e)=> {
      // temporary
      _this.className = 'select';
    };

    _this.desc = µ('+div', _this.display);
    _this.desc.className = 'desc show';

    _this.addFromArray = function(arr) {
      arr.forEach(function(item, ind, arr) {
        let tmp = µ('+img', _this.thumbs);
        tmp.src = item[0];
        tmp.from = item[2];
        tmp.desc = item[1];

        tmp.onclick = (e)=> {
          _this.switch(tmp);
        };

        if (ind == 0) {
          _this.switch(tmp);
        }
      });
    };

    _this.advanceTimer = setTimeout(_this.displayNext, 5000);

    _this.switch = (el)=> {
      if (_this.selected) _this.selected.className = '';
      _this.selected = el;
      _this.frame.src = el.src;
      _this.desc.textContent = el.desc;

      var box = el.getBoundingClientRect();

      if (box.top < 0) {
        _this.thumbs.scrollTop = _this.thumbs.scrollTop + (box.top - 20);
      } else if (box.bottom > window.innerHeight) {
        _this.thumbs.scrollTop = _this.thumbs.scrollTop + (box.bottom - window.innerHeight + 20);
      }

      //_this.className = 'show';
      el.className = 'selected';
    };

    var handleTimer = (pause) => {
      if (pause) {
        clearTimeout(_this.advanceTimer);
        _this.advanceTimer = setTimeout(_this.displayNext, 30000);
      } else {
        clearTimeout(_this.advanceTimer);
        _this.advanceTimer = setTimeout(_this.displayNext, 5000);
        _this.className = 'show';
      }
    };

    _this.displayNext = (pause)=> {
      handleTimer(pause);
      if (_this.thumbs.children.length) {
        if (_this.selected.nextElementSibling) {
          _this.switch(_this.selected.nextElementSibling);
        } else {
          _this.switch(_this.thumbs.firstElementChild);
        }
      }

    };

    _this.displayPrevious = (pause)=> {
      handleTimer(pause);
      if (_this.thumbs.children.length) {
        if (_this.selected.previousElementSibling) {
          _this.switch(_this.selected.previousElementSibling);
        } else {
          _this.switch(_this.thumbs.lastElementChild);
        }
      }
    };

    _this.clear = ()=> {
      _this.thumbs.innerHTML = '';
    };
  };
});

var Gallery = document.registerElement('gal-lery', gallery);
