"use strict";
import Renderer from './renderer.js';
import Game from './game.js';
import Input from './input.js';
// import {} from './utils.js';

(async function(){
  const canvas = new Renderer(document, {width: 1080, height: 1920} );
  let input = new Input(document);
  input.setBounds(canvas.bound);
  window.onresize = ()=>{ // renewing 
    canvas.configure();
    input.setBounds(canvas.bound);
  };
  const game = new Game(canvas);
  window.rects = [];
  window.trig = [];
  // let rects = [
  //   {top: 50, left: 50, width: 100, height: 200},
  //   {top: 300, left: 50, width: 100, height: 200},
  //   {top: 200, left: 250, width: 100, height: 200},
  // ];
  rects.push(canvas.addTestRect({top: 50, left: 50, width: 200, height: 100}, {fillStyle: 'darkgreen'}));
  rects.push(canvas.addTestRect({top: 300, left: 50, width: 100, height: 200}, {fillStyle: 'darkorange'}));
  rects.push(canvas.addTestRect({top: 200, left: 250, width: 100, height: 200}, {fillStyle: 'darkblue'}));
  console.log(rects);
  trig[0] = input.addMouseArea(rects[0].box, function(e) {
    if (e.type == 1 && e.buttons[1] && e.isHover) { 
      rects[0].style({fillStyle: 'green'});
    } else {
      rects[0].style({fillStyle: 'darkgreen'});
    }
  });
  trig[1] = input.addMouseArea(rects[1].box, function(e) { 
    if (e.isHover) {
      rects[1].style({fillStyle: 'orange'});
    } else {
      rects[1].style({fillStyle: 'darkorange'});
    }
  });
  trig[2] = input.addMouseArea(rects[2].box, function(e) {
    rects[2].style({fillStyle: 'blue'});
  });
  console.log(trig);
  canvas.render();
  window.canvas = canvas;
})()

