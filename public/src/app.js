include(['./config.js'], function() {
  µ('#prev').onclick = ()=> {
    µ('#prev').style.opacity = .5;
    var data = { click: true, prevBut:true };
    console.log('prev');
    post('/control.json', { prev:true }, (res)=> {
      if (res.rep) {
        µ('#respText').textContent = 'Previous';
        µ('#prev').style.opacity = 1;
      }
    });
  };

  µ('#next').onclick = ()=> {
    µ('#next').style.opacity = .5;
    var data = { click: true, nextBut:true };
    console.log('next');
    post('/control.json', { next:true }, (res)=> {
      if (res.rep) {
        µ('#respText').textContent = 'Next';
        µ('#next').style.opacity = 1;
      }
    });
  };

  µ('#menu').onclick = ()=> {
    µ('#menu').style.opacity = .5;
    var data = { click: true, menuBut:true };
    post('/control.json', { menu:true }, (res)=> {
      if (res.rep) {
        µ('#respText').textContent = 'Menu';
        µ('#menu').style.opacity = 1;
      }
    });
  };

  //date.toString()
});
