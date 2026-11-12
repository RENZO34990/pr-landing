/* Triveni: cada carga varía el tono del vino y qué río queda a cada lado. */
(function(){
  var st = document.documentElement.style;
  var P = [
    ['138,36,72','176,62,96','100,38,56','64,21,34','#B95F76'],
    ['150,30,38','192,64,60','112,30,34','72,18,22','#C46A62'],
    ['118,36,104','160,70,150','86,32,80','56,20,52','#B26AAE'],
    ['134,56,36','178,90,56','98,46,30','62,28,18','#C98058']
  ];
  var T = ['228,182,95','232,128,63','93,181,164'];
  var PERM = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
  var last = {};
  try { last = JSON.parse(localStorage.getItem('tv_pal') || '{}'); } catch(e){}
  function pick(n, avoid){ var i; do { i = Math.floor(Math.random()*n); } while(n > 1 && i === avoid); return i; }
  var p = pick(P.length, last.p), t = pick(PERM.length, last.t);
  var c = P[p];
  st.setProperty('--w1', c[0]); st.setProperty('--w2', c[1]); st.setProperty('--w3', c[2]); st.setProperty('--w4', c[3]); st.setProperty('--rose', c[4]);
  st.setProperty('--rl', T[PERM[t][0]]); st.setProperty('--rc', T[PERM[t][1]]); st.setProperty('--rr', T[PERM[t][2]]);
  st.setProperty('--gy1', (76 + Math.random()*18).toFixed(0) + '%'); st.setProperty('--gy3', (76 + Math.random()*18).toFixed(0) + '%');
  st.setProperty('--gx1', (8 + Math.random()*14).toFixed(0) + '%'); st.setProperty('--gx3', (78 + Math.random()*14).toFixed(0) + '%');
  try { localStorage.setItem('tv_pal', JSON.stringify({ p: p, t: t })); } catch(e){}
})();
