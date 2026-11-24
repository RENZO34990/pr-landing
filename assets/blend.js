/* Triveni · Mezcla de paletas
   Cada sección declara sus colores en el marcado (data-bg, data-fg, data-body,
   data-muted). Cada frontera entre secciones tiene su propio valor, de 0 (sin mezclar)
   a 1 (mezclada del todo), y el color de la página es la suma de esos valores sobre la
   primera paleta. Un valor de frontera nunca avanza más que el de la frontera anterior,
   así que por rápido que se haga scroll el color solo puede estar entre dos secciones
   vecinas, nunca en una mezcla turbia de tres.
   Se recolorean juntos el fondo, los titulares, el texto y el texto gris.

   Ajustes por sección (opcionales):
     data-at    en qué punto de la pantalla (0 arriba, 1 abajo) se centra la mezcla (0.5)
     data-span  cuánto de la pantalla ocupa la mezcla: 0.1 cambio rápido, 1 fundido lento (0.5)
   Con movimiento reducido no se mezcla: cada paleta se cambia al llegar la sección al medio. */
(function(){
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var blocks = [], last = '', raf = 0;
  var KEYS = [['bg','--bg'],['fg','--fg'],['body','--bd'],['muted','--mu']];

  function parse(el){
    var p = {};
    for(var i=0;i<KEYS.length;i++){
      var v = (el.getAttribute('data-' + KEYS[i][0]) || '').trim().split(/[\s,]+/).map(Number);
      if(v.length !== 3 || v.some(isNaN)) return null;
      p[KEYS[i][0]] = v;
    }
    return p;
  }
  function ease(t){ return t*t*(3-2*t); }
  function clamp(x){ return x < 0 ? 0 : x > 1 ? 1 : x; }

  function frame(){
    raf = 0;
    var V = window.innerHeight, prev = 1, acc = {}, i, k, c;
    for(k=0;k<KEYS.length;k++) acc[KEYS[k][0]] = blocks[0].pal[KEYS[k][0]].slice();
    for(i=1;i<blocks.length;i++){
      var b = blocks[i], top = b.el.getBoundingClientRect().top, v;
      if(reduce) v = top <= b.at*V ? 1 : 0;
      else v = ease(clamp(((b.at + b.span/2)*V - top)/(b.span*V)));
      if(v > prev) v = prev;                 /* nunca más que la frontera anterior */
      prev = v;
      if(v === 0) continue;
      for(k=0;k<KEYS.length;k++){
        var key = KEYS[k][0], a = blocks[i-1].pal[key], n = b.pal[key];
        for(c=0;c<3;c++) acc[key][c] += v*(n[c]-a[c]);
      }
    }
    var out = '';
    for(k=0;k<KEYS.length;k++){ var key2 = KEYS[k][0]; for(c=0;c<3;c++) acc[key2][c] = Math.round(acc[key2][c]); out += acc[key2].join(',') + '|'; }
    if(out === last) return;                 /* solo se escribe cuando cambia */
    last = out;
    var st = document.documentElement.style;
    for(k=0;k<KEYS.length;k++) st.setProperty(KEYS[k][1], acc[KEYS[k][0]].join(','));
    var meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content', 'rgb(' + acc.bg.join(',') + ')');
  }
  function req(){ if(!raf) raf = requestAnimationFrame(frame); }

  window.PaletteBlend = {
    init: function(){
      Array.prototype.forEach.call(document.querySelectorAll('[data-bg]'), function(el){
        var pal = parse(el); if(!pal) return;
        var at = parseFloat(el.getAttribute('data-at')), span = parseFloat(el.getAttribute('data-span'));
        blocks.push({ el: el, pal: pal, at: isNaN(at) ? .5 : at, span: isNaN(span) ? .5 : Math.max(.05, span) });
      });
      if(blocks.length < 2) return;
      window.addEventListener('scroll', req, { passive: true });
      window.addEventListener('resize', req);
      req();
    }
  };
})();
