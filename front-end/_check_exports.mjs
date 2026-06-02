import('../src/theme.js').then(m => {
  console.log(Object.keys(m));
}).catch(e => console.error('FAIL', e));
