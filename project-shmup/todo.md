**rewrite in typescript maybe???** it would be much easier to maintain code, imo

- [ ] Global "do", organise engine like this:
      *Game*: {
        *Objects*: {
          createSpace(), // add space for entities and provide other methods
          add(), // adds one object into created space and returns it (player = Space.add({x,y,sprite...})
          addX(), // multiple
          static useBody(), // make object solid and enrich it with methods for collision checking, debug box drawing, etc...
        },
        *Atlas*: {
          static load(url, spritesDefinitions), // load into 
          static sprite(spriteID),
        },
        *Input*: {}, // API for entire input and tab/window events observer.
        *Time*: {}, // Don't know how and what's here exactly, but it point of time calc's, sync engine parts/modules into one and similar stuff. Somethingsomething...
      }
  - [ ] base *Object* class for entities describing what props/methods it could/should have for in-game interaction and engine internal processes
  - [x] refactor Atlas:
    - [x] all sprites loaded with *Atlas.load(url, spritesDefinitions)*
    - [x] accessible with *Atlas.list[spriteID]*
    - [x] *Atlas.list(spriteID)* is an object with:
      - [x] *.draw() - drawing on canvas
      - [x] *.drawBox() - drawing box edge for debugging (Game.debug.draw === 'spriteBox')
  - [ ] move all debug options/flags into Game.debug
  - [x] Input as stand-alone class
    - [ ] filter keydown repeating
    - [ ] .. and probably some key-combinations check (CtrlLeft+KeyA, ShiftLeft+AltLeft+KeyW) implementation with keyPressedList ... low priority feature
  - [x] rewrite rescale/reinit code