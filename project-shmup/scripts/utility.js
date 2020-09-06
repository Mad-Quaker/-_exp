export const randomF = Math.random; // alias
export const randomI = (value) => Math.round(randomF() * value);
export const randomA = function(...args) { // equaly weighted random pick
  return args[Math.round(randomF() * args.length - 0.5)];
}

export const switcher = function (states, callback) {
  let selected = 0;
  callback(states[selected]);
  return function() {
    selected++;
    if (selected > states.length-1) selected = 0;
    callback(states[selected]);
  }
}
