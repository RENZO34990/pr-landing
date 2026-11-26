/* Triveni · Paneles líquidos
   Toda la pila es UN solo contorno, redibujado en cada frame a partir de dónde está cada panel.
   Hecha con formas separadas (una tarjeta más un puente curvo) aparece una costura finísima donde
   se tocan y parpadea cuando algo se mueve; con un solo trazo no hay costura.
   La curva de cada cuello cede cuando el hueco es corto: una unión apretada se pellizca en cintura
   en vez de plegarse sobre sí misma.

   Arrancar un panel:
     - al principio el panel se mueve menos que el puntero, y el cuello se lee como resistencia;
     - el cuello se adelgaza a medida que tiras y al final se corta; las dos mitades se redondean;
     - si sueltas después, el cuello vuelve a crecer como un hilo que se engrosa, más lento que la
       rotura (unirse no tiene un momento que mirar, como sí lo tiene el corte);
     - con el puntero encima, el panel bajo el cursor se queda quieto y los demás le hacen sitio.

   Ajustes (atributos de .goo, o el objeto DEF de abajo):
     data-corner  "round" | "square"          esquinas redondas o rectas
     data-neck    "wide" | "pinched"          cuellos anchos o pellizcados
     data-gap     px entre paneles (lo fija el CSS con --goo-gap; aquí solo se mide)
     data-pull    px que hay que tirar antes de que se corte
     data-ease    "wobbly" | "calm"           resorte con rebote o tranquilo
     data-axis    "auto" | "row" | "column"   en fila, en columna o según el ancho (auto)
   El color se cambia en el CSS (.goo-fill y el degradado .goo-edge). */
(function(){
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DEF = { corner:'round', neck:'wide', pull:150, ease:'wobbly', axis:'auto' };
  var SPR = { wobbly:{ k:190, c:11 }, calm:{ k:120, c:26 } };

  function clamp(x,a,b){ return x<a?a:x>b?b:x; }
  function lerp(a,b,t){ return a+(b-a)*t; }
  function sm(t){ t = clamp(t,0,1); return t*t*(3-2*t); }
  function dist(a,b){ return Math.hypot(a.u-b.u, a.v-b.v); }
  function at(a,b,t){ return { u:lerp(a.u,b.u,t), v:lerp(a.v,b.v,t) }; }

  function Goo(root){
    var o = {
      corner: root.getAttribute('data-corner') || DEF.corner,
      neck:   root.getAttribute('data-neck')   || DEF.neck,
      pull:   parseFloat(root.getAttribute('data-pull')) || DEF.pull,
      ease:   root.getAttribute('data-ease')   || DEF.ease,
      axis:   root.getAttribute('data-axis')   || DEF.axis
    };
    if(reduce) o.ease = 'calm';
    var spring = SPR[o.ease] || SPR.wobbly;
    var svg = root.querySelector('.goo-svg'), fill = svg.querySelector('.goo-fill'), edge = svg.querySelector('.goo-edge');
    var grads = svg.querySelectorAll('linearGradient');
    var els = Array.prototype.slice.call(root.querySelectorAll('.gp'));
    var P = els.map(function(el){ return { el:el, x:0,y:0,w:0,h:0, ox:0,oy:0, vx:0,vy:0, tx:0,ty:0 }; });
    var N = []; for(var i=0;i<P.length-1;i++) N.push({ st:'on', grow:1, stub:0, s:0, w:0 });
    var axis = 'row', gap = 40, R = 26, F = 18, W = 0, H = 0;
    var drag = null, hover = -1, raf = 0, last = 0, noClick = false;

    function measure(){
      W = root.clientWidth; H = root.clientHeight;
      svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      P.forEach(function(p){ p.x = p.el.offsetLeft; p.y = p.el.offsetTop; p.w = p.el.offsetWidth; p.h = p.el.offsetHeight; });
      axis = o.axis === 'row' ? 'row' : o.axis === 'column' ? 'col' : (P[1].x > P[0].x + P[0].w*.5 ? 'row' : 'col');
      root.classList.toggle('is-col', axis === 'col'); root.classList.toggle('is-row', axis === 'row');
      gap = axis === 'row' ? P[1].x - (P[0].x + P[0].w) : P[1].y - (P[0].y + P[0].h);
      R = o.corner === 'square' ? 2 : 26; F = o.corner === 'square' ? 3 : Math.min(28, Math.max(6, gap*.3));
      for(var g=0; g<grads.length; g++){
        grads[g].setAttribute('x1', 0); grads[g].setAttribute('y1', 0);
        grads[g].setAttribute('x2', axis === 'row' ? W : 0); grads[g].setAttribute('y2', axis === 'row' ? 0 : H);
      }
    }
    /* espacio del eje: u va a lo largo de la pila, v a lo ancho */
    function rect(p){
      var x = p.x + p.ox, y = p.y + p.oy;
      return axis === 'row' ? { u0:x, u1:x+p.w, v0:y, v1:y+p.h } : { u0:y, u1:y+p.h, v0:x, v1:x+p.w };
    }
    function map(q){ return axis === 'row' ? q.u.toFixed(2) + ' ' + q.v.toFixed(2) : q.v.toFixed(2) + ' ' + q.u.toFixed(2); }

    function neckGeom(i){
      var a = rect(P[i]), b = rect(P[i+1]);
      var cA = (a.v0 + a.v1)/2, cB = (b.v0 + b.v1)/2;
      var Lm = Math.hypot(b.u0 - a.u1, cB - cA);
      var cross = Math.min(a.v1 - a.v0, b.v1 - b.v0);
      var w0 = Math.max(26, cross*(o.neck === 'pinched' ? .13 : .34));
      return { a:a, b:b, cA:cA, cB:cB, s: clamp((Lm - gap)/o.pull, 0, 1), w0:w0, Lm:Lm };
    }
    function neckWidth(i, G){
      var n = N[i], th = n.st === 'grow' ? lerp(2.6/G.w0, 1, sm(n.grow)) : Math.pow(1 - G.s, .85);
      return Math.max(2.6, G.w0*th);
    }

    function roundedPath(nodes, cub){
      var n = nodes.length, X = [], E = [], i;
      for(i=0;i<n;i++){
        var V = nodes[i], pv = nodes[(i+n-1)%n], nx = nodes[(i+1)%n];
        var d1 = dist(V,pv) || 1, d2 = dist(V,nx) || 1, r = Math.min(V.r, d1/2, d2/2);
        E[i] = at(V,pv,r/d1); X[i] = at(V,nx,r/d2);
      }
      var d = 'M' + map(X[0]);
      for(i=0;i<n;i++){
        var j = (i+1)%n;
        if(cub[i]){ var cc = cub[i](X[i], E[j]); d += 'C' + map(cc[0]) + ' ' + map(cc[1]) + ' ' + map(E[j]); }
        else d += 'L' + map(E[j]);
        d += 'Q' + map(nodes[j]) + ' ' + map(X[j]);
      }
      return d + 'Z';
    }

    function draw(){
      var d = '', i = 0, a, b;
      while(i < P.length){
        a = i; b = i;
        while(b < N.length && N[b].st !== 'off') b++;
        /* el tramo a..b es un solo contorno */
        var nodes = [], cub = {}, G = [];
        var k;
        for(k=a;k<b;k++) G[k] = neckGeom(k);
        var rc = [];
        for(k=a;k<=b;k++) rc[k] = rect(P[k]);
        var push = function(u,v,r){ nodes.push({ u:u, v:v, r:r }); return nodes.length - 1; };
        for(k=a;k<=b;k++){
          var q = rc[k];
          push(q.u0, q.v0, R); push(q.u1, q.v0, R);
          if(k === b && k < N.length && N[k].st === 'off' && N[k].stub > 0){
            var Gs = neckGeom(k), st = N[k].stub, c = (q.v0+q.v1)/2, ws = 1.5 + 5*st, ln = 16*st;
            push(q.u1, c - ws, ws*.8); push(q.u1 + ln, c, ws*.9); push(q.u1, c + ws, ws*.8);
          }
          if(k < b){
            var g = G[k], w = neckWidth(k, g), pw = w*.1;
            var ia = push(g.a.u1, g.cA - w/2, F);
            push(g.b.u0, g.cB - w/2, F);
            (function(g,w,pw){ cub[ia] = function(Xp,Ep){ var kk = clamp((Ep.u - Xp.u)*.45, 4, 90);
              var pe = Math.min(pw, Math.abs(Ep.u - Xp.u)*.14); return [{ u:Xp.u + kk, v:Xp.v + pe }, { u:Ep.u - kk, v:Ep.v + pe }]; }; })(g,w,pw);
          }
        }
        for(k=b;k>=a;k--){
          var q2 = rc[k];
          push(q2.u1, q2.v1, R); push(q2.u0, q2.v1, R);
          if(k === a && k > 0 && N[k-1].st === 'off' && N[k-1].stub > 0){
            var st2 = N[k-1].stub, c2 = (q2.v0+q2.v1)/2, ws2 = 1.5 + 5*st2, ln2 = 16*st2;
            push(q2.u0, c2 + ws2, ws2*.8); push(q2.u0 - ln2, c2, ws2*.9); push(q2.u0, c2 - ws2, ws2*.8);
          }
          if(k > a){
            var g2 = G[k-1], w2 = neckWidth(k-1, g2), pw2 = w2*.1;
            var ib = push(g2.b.u0, g2.cB + w2/2, F);
            push(g2.a.u1, g2.cA + w2/2, F);
            (function(pw2){ cub[ib] = function(Xp,Ep){ var kk = clamp((Xp.u - Ep.u)*.45, 4, 90);
              var pe = Math.min(pw2, Math.abs(Ep.u - Xp.u)*.14); return [{ u:Xp.u - kk, v:Xp.v - pe }, { u:Ep.u + kk, v:Ep.v - pe }]; }; })(pw2);
          }
        }
        d += roundedPath(nodes, cub);
        i = b + 1;
      }
      fill.setAttribute('d', d); edge.setAttribute('d', d);
      P.forEach(function(p){ p.el.style.transform = 'translate3d(' + p.ox.toFixed(2) + 'px,' + p.oy.toFixed(2) + 'px,0)'; });
    }

    function stretchOf(i){ var s = 0, k; for(k=Math.max(0,i-1); k<=Math.min(N.length-1,i); k++) if(N[k].st !== 'off') s = Math.max(s, neckGeom(k).s); return s; }

    function step(dt){
      var i;
      /* objetivos */
      for(i=0;i<P.length;i++){
        var p = P[i], tx = 0, ty = 0;
        if(drag && drag.i === i){
          var res = lerp(.42, 1, sm(stretchOf(i)*1.15));
          if(P[i].free) res = 1;
          tx = drag.dx*res; ty = drag.dy*res;
          if(drag.lock){ if(axis === 'col') tx = drag.dx*res, ty = 0; }
        } else if(hover >= 0 && !drag && hover !== i){
          var sgn = i > hover ? 1 : -1, sh = 12;
          if(axis === 'row') tx = sgn*sh; else ty = sgn*sh;
        }
        p.tx = tx; p.ty = ty;
        var k = drag && drag.i === i ? 420 : spring.k, c = drag && drag.i === i ? 36 : spring.c;
        p.vx += (k*(p.tx - p.ox) - c*p.vx)*dt; p.vy += (k*(p.ty - p.oy) - c*p.vy)*dt;
        p.ox += p.vx*dt; p.oy += p.vy*dt;
      }
      /* cuellos: se cortan, se redondean y vuelven a crecer */
      for(i=0;i<N.length;i++){
        var n = N[i];
        if(n.st === 'on' || n.st === 'grow'){
          var G = neckGeom(i);
          if(G.s >= 1){ n.st = 'off'; n.stub = 1; P[i].free = true; P[i+1].free = true; }
          else if(n.st === 'grow'){ n.grow += dt/1.4; if(n.grow >= 1){ n.grow = 1; n.st = 'on'; } }
        }
        if(n.st === 'off'){
          if(n.stub > 0) n.stub = Math.max(0, n.stub - dt/.3);          /* la rotura es rápida */
          var calm = !drag && Math.hypot(P[i].ox, P[i].oy) < gap*.8 && Math.hypot(P[i+1].ox, P[i+1].oy) < gap*.8;
          if(calm){ n.st = 'grow'; n.grow = 0; P[i].free = P[i+1].free = false; }
        }
      }
    }
    function active(){
      if(drag || hover >= 0) return true;
      var i;
      for(i=0;i<P.length;i++) if(Math.abs(P[i].vx) + Math.abs(P[i].vy) > .05 || Math.abs(P[i].ox - P[i].tx) + Math.abs(P[i].oy - P[i].ty) > .04) return true;
      for(i=0;i<N.length;i++) if(N[i].st === 'grow' || N[i].stub > 0 || N[i].st === 'off') return true;
      return false;
    }
    function tick(now){
      raf = 0;
      var dt = Math.min(.033, (now - last)/1000 || .016); last = now;
      step(dt); draw();
      if(active()) raf = requestAnimationFrame(tick);
    }
    function kick(){ if(!raf){ last = performance.now(); raf = requestAnimationFrame(tick); } }

    /* ---- puntero ---- */
    els.forEach(function(el, i){
      el.addEventListener('pointerenter', function(e){ if(e.pointerType === 'mouse'){ hover = i; kick(); } });
      el.addEventListener('pointerleave', function(){ if(hover === i){ hover = -1; kick(); } });
      el.addEventListener('pointerdown', function(e){
        if(e.button) return;
        drag = { i:i, sx:e.clientX, sy:e.clientY, dx:0, dy:0, moved:0, lock:e.pointerType === 'touch' };
        try{ el.setPointerCapture(e.pointerId); }catch(err){}
        el.classList.add('grab'); kick();
      });
    });
    window.addEventListener('pointermove', function(e){
      if(!drag) return;
      drag.dx = e.clientX - drag.sx; drag.dy = e.clientY - drag.sy;
      drag.moved = Math.max(drag.moved, Math.hypot(drag.dx, drag.dy));
      kick();
    });
    function release(){
      if(!drag) return;
      if(drag.moved > 7){ noClick = true; setTimeout(function(){ noClick = false; }, 60); }
      els[drag.i].classList.remove('grab'); drag = null; kick();
    }
    window.addEventListener('pointerup', release); window.addEventListener('pointercancel', release);
    /* tras arrastrar no se entra al enlace: se corta antes de que lo vea transiciones.js */
    window.addEventListener('click', function(e){ if(noClick){ e.preventDefault(); e.stopPropagation(); } }, true);
    els.forEach(function(el){ el.addEventListener('dragstart', function(e){ e.preventDefault(); }); });

    function layout(){ measure(); draw(); }
    layout();
    if(window.ResizeObserver) new ResizeObserver(function(){ layout(); }).observe(root);
    window.addEventListener('resize', layout);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    root.__goo = { layout:layout, kick:kick, P:P, N:N, state:function(){ return { axis:axis, gap:gap, necks:N.map(function(n){ return n.st; }) }; },
      drag:function(i,dx,dy){ drag = drag || { i:i, sx:0, sy:0, dx:0, dy:0, moved:99, lock:false }; drag.i = i; drag.dx = dx; drag.dy = dy; kick(); },
      drop:release };
  }

  Array.prototype.forEach.call(document.querySelectorAll('.goo'), Goo);
})();
