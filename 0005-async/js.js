// Функция задержки
// с возвращением случайного числа
const delayAndGetRandom = (ms) => {
  return new Promise(resolve => setTimeout(
    () => {
      const val = Math.trunc(Math.random() * 100);
      resolve(val);
    }, ms
  ));
};

async function fn() {
  let x = window.obj;
  console.log('inside-0', x);
  x.a = await 9;
  console.log('inside-1', window.obj);
  x.b = await delayAndGetRandom(2000);
  console.log('inside-2', window.obj);
  x.c = await 5;
  console.log('inside-3', window.obj);
  await delayAndGetRandom(3000);
  
  return x.a + x.b * x.c;
}

// Вызов fn
function run() {
  window.obj = {
    a: undefined,
    b: undefined,
    c: undefined,
  }
  fn().catch(err=>console.log('error',err)).then(data=>console.log('out',data));
  console.log('async prepared', window.obj);
}
