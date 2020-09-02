// (async () => {
//   const xx = await import('./something.js');
//   console.log(xx);
// })()

// Promise.all( ['./something.js','./something2.js'].map(async (file)=>{return await import(file)}))
//   .then(imports=>{
//     console.log(imports);
//     console.log(imports[0]);
//     console.log(imports[1].deval);
//   })

import Ssds from './something.js';
console.log(Ssds);
