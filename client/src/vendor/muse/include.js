var debug = false;

/*****************************************
* This is an adaptation of an include manager that I had written
* a while back. Really, I should just switch over to require.js,
* but it's easy to get stuck in your ways. That being said, it works pretty well.
******************************************/
var includeManager = new function() {
  var _this = this;
  this.script = document.currentScript;
  this.scriptRoot = this.script.src.substr(0, this.script.src.lastIndexOf('/') + 1);
  this.root = document.location.origin + document.location.pathname;
  var pageName = document.location.pathname.split('/').pop();
  if (~pageName.indexOf('.')) {
    console.log(pageName);
    this.root = this.root.substring(0, this.root.indexOf(pageName));
  }

  this.includes = [];

  //record new scripts as they are added
  this.register = function(srcs, loadFxn, src) {
    this.shorten(src);
    var dep = [];
    if (typeof this.includes[src] == 'object') {
      dep = this.includes[src].dependents;
    }

    this.includes[src] = { src:src, srcs:srcs, loadFxn:loadFxn, done:false, dependents:dep };
  };

  this.addDependent = function(src, which) {
    this.shorten(src);
    this.shorten(which);
    var dep = [];
    var done = false;
    if (this.includes.indexOf(src) >= 0) {
      dep = this.includes[src].dependents;
      done = this.includes[src].done;
    } else this.includes[src] = { src:src, done:false, dependents:dep };
    if (dep.indexOf(src) == -1) dep.push(which);
    this.includes[src].dependents = dep;
  };

  this.shorten = function(src) {
    if (~src.indexOf(_this.root)) src = src.substring(_this.root.length);
    return src;
  };

  this.checkIncludes = function(src) {
    src = this.shorten(src);
    var incl = _this.includes[src];
    if (debug) console.log('Checking includes for ' + src);
    if (typeof incl == 'object') {
      var loaded = true;
      for (var i = 0; i < incl.srcs.length; i++) {
        var next = _this.includes[incl.srcs[i]];
        if (typeof next == 'object') {
          var noDone = (typeof next.done == 'undefined');
          if (debug) console.log(next.src + ' is ' + ((next.done || (!next.loading && noDone)) ? 'done' : 'not done'));
          if (!(next.done || (!next.loading && noDone))) {
            loaded = false;
            if (next.dependents.indexOf(src) == -1) next.dependents.push(src);
          }
        }
      }

      if (loaded && !incl.done) {
        if (debug) console.log('Note: ' + incl.src + ' and includes are done');
        incl.done = true;
        if (typeof incl.loadFxn == 'function') incl.loadFxn();
        for (var i = 0; i < incl.dependents.length; i++) {
          if (debug) console.log('recheck ' + incl.dependents[i]);
          _this.checkIncludes(incl.dependents[i]);
        }
      }
    }
  };
};

function include(srcLocations, onLoaded) {
  var curScript = includeManager.shorten(document.currentScript.src);
  if (debug) console.log('These are the includes for ' + curScript);
  var numLoaded = 0;
  includeManager.register(srcLocations, onLoaded, curScript);
  var loaded = function() {
    if (this.src) {
      var src = includeManager.shorten(this.src);
      if (debug) console.log('just loaded ' + src);

      if (src) {
        var that = includeManager.includes[src];
        that.loading = false;
        if (typeof that.done == 'undefined') {
          that.done = true;
          if (debug) console.log(src + ' is done and has no dependents');
        }
      }
    }

    if (++numLoaded >= srcLocations.length) {
      includeManager.checkIncludes(curScript);
    }
  };

  var scripts = [].slice.call(document.querySelectorAll('script'));
  for (var i = 0; i < srcLocations.length; i++) {
    var found = false;
    if (srcLocations[i].charAt(0) == '.') {
      srcLocations[i] = includeManager.scriptRoot + srcLocations[i].substring(2);
    }

    if (debug) console.log('-->' + srcLocations[i]);
    scripts.forEach(function(item, index, array) {
      if (item.getAttribute('src') == srcLocations[i]) found = true;
    });

    if (!found) {
      var scrpt = document.createElement('script');
      var src = includeManager.shorten(srcLocations[i]);
      scrpt.src = src;
      scrpt.addEventListener('load', loaded, false);
      includeManager.includes[src] = { src:src, loading:true, dependents:[] };
      document.head.insertBefore(scrpt, document.currentScript);
    }

    //in case another module loaded the script just before and
    //it hasn't loaded fully
    else if (includeManager.includes[srcLocations[i]] && !includeManager.includes[srcLocations[i]].done) {
      //console.log(curScript + ' is dependent on ' + srcLocations[i]);
      includeManager.includes[srcLocations[i]].dependents.push(curScript);
    } else loaded();
  }

  if (!srcLocations.length) loaded();
}

var muse = new function() {
  this.script = document.currentScript;
  this.root = includeManager.scriptRoot;
  this.app = this.script.getAttribute('main');

  // Make utils available everywhere by default
  include([this.root + 'utils.js', this.app]);

};
