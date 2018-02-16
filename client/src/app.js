obtain([], ()=> {
  exports.app = {};
  console.log('loaded');

  exports.app.start = ()=> {
    console.log('start');

    µ('#prev').onclick = ()=> {
      µ('#prev').style.opacity = .5;
      var data = { click: true, prevBut: true };
      console.log('prev');
      post('/control', { prev: true }).then((res)=> {
        var ret = JSON.parse(res);
        if (ret.rep) {
          µ('#respText').textContent = 'Previous';
          µ('#prev').style.opacity = 1;
        }
      });
    };

    µ('#next').onclick = ()=> {
      µ('#next').style.opacity = .5;
      var data = { click: true, nextBut: true };
      console.log('next');
      post('/control', { next: true }).then((res)=> {
        var ret = JSON.parse(res);
        if (ret.rep) {
          µ('#respText').textContent = 'Next';
          µ('#next').style.opacity = 1;
        }
      });
    };

    µ('#menu').onclick = ()=> {
      µ('#menu').style.opacity = .5;
      var data = { click: true, menuBut: true };
      post('/control', { menu: true }).then((res)=> {
        var ret = JSON.parse(res);
        if (ret.rep) {
          µ('#respText').textContent = 'Menu';
          µ('#menu').style.opacity = 1;
        }
      });
    };
  };

  provide(exports);
});
