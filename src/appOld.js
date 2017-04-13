include([], function() {
  var ws = new WebSocket(this.address);
  ws.onopen = function() {
    ws.isOpen =true;
    ws.onmessage = function(evt) {
      _this.onMessage(evt);
    };
  };
});
