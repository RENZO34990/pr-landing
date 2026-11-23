/* Triveni: cada carga varía el tono del vino, qué río queda a cada lado
   y la familia de color de cada amanecer (hero y las dos transiciones). */
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

  /* Familias de amanecer. Cada una: núcleo (casi blanco), tres tonos que se
     apagan hacia el vino, y el color del borde fino hacia los lados.
     Temática: los tres ríos (oro, brasa, jade) más rosa del vino y amatista. */
  var FAM = [
    { n:'oro',   core:[255,247,228], a:[247,205,110], b:[232,132,58],  c:[176,56,62],  rim:[168,200,255] },
    { n:'brasa', core:[255,240,230], a:[255,160,100], b:[226,78,62],   c:[150,40,76],  rim:[255,208,178] },
    { n:'jade',  core:[236,255,249], a:[130,226,200], b:[44,150,148],  c:[52,74,138],  rim:[176,238,255] },
    { n:'rosa',  core:[255,241,246], a:[255,176,200], b:[206,86,146],  c:[108,44,128], rim:[255,208,236] },
    { n:'amatista', core:[246,240,255], a:[206,176,255], b:[136,92,214], c:[74,46,142], rim:[255,214,204] }
  ];

  var last = {};
  try { last = JSON.parse(localStorage.getItem('tv_pal') || '{}'); } catch(e){}
  function pick(n, avoid){ var i; do { i = Math.floor(Math.random()*n); } while(n > 1 && i === avoid); return i; }
  var p = pick(P.length, last.p), t = pick(PERM.length, last.t);
  var c = P[p];
  st.setProperty('--w1', c[0]); st.setProperty('--w2', c[1]); st.setProperty('--w3', c[2]); st.setProperty('--w4', c[3]); st.setProperty('--rose', c[4]);
  st.setProperty('--rl', T[PERM[t][0]]); st.setProperty('--rc', T[PERM[t][1]]); st.setProperty('--rr', T[PERM[t][2]]);
  st.setProperty('--gy1', (76 + Math.random()*18).toFixed(0) + '%'); st.setProperty('--gy3', (76 + Math.random()*18).toFixed(0) + '%');
  st.setProperty('--gx1', (8 + Math.random()*14).toFixed(0) + '%'); st.setProperty('--gx3', (78 + Math.random()*14).toFixed(0) + '%');

  /* ---- amaneceres ---- */
  function rgb2hsl(r,g,b){ r/=255; g/=255; b/=255; var mx=Math.max(r,g,b), mn=Math.min(r,g,b), h=0, s=0, l=(mx+mn)/2, d=mx-mn;
    if(d){ s = l>.5 ? d/(2-mx-mn) : d/(mx+mn); h = mx===r ? (g-b)/d+(g<b?6:0) : mx===g ? (b-r)/d+2 : (r-g)/d+4; h/=6; } return [h,s,l]; }
  function hue(p,q,t){ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; }
  function hsl2rgb(h,s,l){ var r,g,b; if(!s){ r=g=b=l; } else { var q = l<.5 ? l*(1+s) : l+s-l*s, p2 = 2*l-q; r=hue(p2,q,h+1/3); g=hue(p2,q,h); b=hue(p2,q,h-1/3); }
    return [Math.round(r*255),Math.round(g*255),Math.round(b*255)]; }
  function shift(rgb, dh, ds, dl){ var x = rgb2hsl(rgb[0],rgb[1],rgb[2]);
    return hsl2rgb((x[0]+dh+1)%1, Math.max(0,Math.min(1,x[1]+ds)), Math.max(0,Math.min(1,x[2]+dl))); }
  function vary(f){
    var dh = (Math.random()-.5)*.075, ds = (Math.random()-.5)*.12, dl = (Math.random()-.5)*.05;
    return { n:f.n, core:f.core, a:shift(f.a,dh,ds,dl), b:shift(f.b,dh*1.3,ds,dl), c:shift(f.c,dh*1.6,ds,dl*.6), rim:shift(f.rim,dh*.6,0,0) };
  }
  var order = FAM.map(function(_,i){ return i; });
  for(var i = order.length-1; i > 0; i--){ var j = Math.floor(Math.random()*(i+1)), k = order[i]; order[i] = order[j]; order[j] = k; }
  if(order[0] === last.s){ var z = order.shift(); order.push(z); }
  var sun = [vary(FAM[order[0]]), vary(FAM[order[1]]), vary(FAM[order[2]])];
  window.TRIVENI_SUN = sun;
  for(var n = 0; n < 3; n++) st.setProperty('--sun' + n, sun[n].a.join(','));
  try { localStorage.setItem('tv_pal', JSON.stringify({ p: p, t: t, s: order[0] })); } catch(e){}
})();
