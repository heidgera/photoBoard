'use strict';

obtain(['µ/utilities.js'], ()=> {
  if (!customElements.get('muse-growl')) {
    class Gallery extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        var _this = this;

        if (!_this.desc) {
          _this.selected = null;

          _this.advanceTimer = null;

          _this.atEnd = true;

          _this.thumbs = µ('+div', _this);
          _this.thumbs.className = 'thumbs';

          _this.display = µ('+div', _this);
          _this.display.className = 'display';

          var tempVideo = µ('+div', _this.display);
          tempVideo.id = 'galleryVideo';

          window.onYouTubeIframeAPIReady = function () {
            console.log('now');

            //_this.showVideo('Y0yOTanzx-s');
          };

          _this.frame = µ('+img', _this.display);
          _this.frame.onclick = (e)=> {
            // temporary
            _this.className = 'select';
          };

          _this.desc = µ('+div', _this.display);
          _this.desc.className = 'desc show';

          _this.addFromArray = function (arr) {
            console.log(arr);
            arr.forEach(function (item, ind, arr) {
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
            _this.desc.innerHTML = el.desc;

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
              _this.advanceTimer = setTimeout(_this.displayNext, 7000);
              _this.className = 'show';
            }
          };

          _this.pause = ()=> {
            clearTimeout(_this.advanceTimer);
          };

          _this.resume = ()=> {
            clearTimeout(_this.advanceTimer);
            _this.advanceTimer = setTimeout(_this.displayNext, 7000);
          };

          _this.displayNext = (pause)=> {
            handleTimer(pause);
            if (player) _this.hideVideo();
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
            if (player) _this.hideVideo();
            if (_this.thumbs.children.length) {
              if (_this.selected.previousElementSibling) {
                _this.switch(_this.selected.previousElementSibling);
              } else {
                _this.switch(_this.thumbs.lastElementChild);
              }
            }
          };

          _this.showVideo = (code)=> {
            µ('#galleryVideo').className = 'playing';
            if (!_this.player) {
              _this.player = new YT.Player('galleryVideo', {
                height: '' + window.innerHeight,
                width: '' + window.innerWidth,
                videoId: code,
                events: {
                  onReady: (event)=> {
                    event.target.playVideo();
                  },

                  onStateChange: ()=> {},
                },
              });
            } else {
              _this.player.cueVideoById({ videoId: code });
              _this.player.playVideo();
            }
          };

          _this.hideVideo = ()=> {
            µ('#galleryVideo').className = '';
            _this.player = null;
            µ('#galleryVideo').src = null;
          };

          _this.clear = ()=> {
            _this.thumbs.innerHTML = '';
          };
        }
      }
    }

    customElements.define('gal-lery', Gallery);
  }

  exports.Gallery = customElements.get('gal-lery');
});
