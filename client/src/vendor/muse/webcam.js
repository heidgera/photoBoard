//object to initialize webcam usage; this works optimally when being run from an ssl server, so that no dialogues need to be pressed.

var webCam = inheritFrom(HTMLVideoElement, function() {
  this.img = document.createElement('video');//document.getElementById('cam');  //grab the video element named "cam"

  this.startCam = function() {
    var _this = this;

    // Get specific vendor methods: this takes care of naming for Firefox, Chrome, and IE
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    // If browser supports user media
    if (navigator.getUserMedia) {
      navigator.getUserMedia({video: true, toString: function() { return 'video'; } },

				function successCallback(stream) {
  if (navigator.getUserMedia == navigator.mozGetUserMedia) {
    _this.src = stream;									//set the video source to the stream if on Firefox
  } else {
    _this.src = window.URL.createObjectURL(stream) || stream; //else, set it to the blob of the stream
  }

  _this.play();		//autoplay the video on success
				},

				function errorCallback(error) {
  alert('An error ocurred getting user media. Code:' + error.code);
				});
    } else {
      //Browser doesn't support user media
      alert('Your browser does not support user media');
    }

  };

  this.stopCam = function() {
    this.src = '';
  };

  this.createdCallback = function() {
    this.startCam();
  };
});

document.registerElement('web-cam', {prototype: webCam.prototype, extends: 'video'});
