/* Triveni · Horizonte
   Amanecer visto desde la órbita, usado como transición de sección.

   - El resplandor se calcula píxel a píxel en 1/4 de la pantalla: su color sale
     del borde del planeta (blanco, tono 1, tono 2, tono 3) y se apaga en la página.
     Llega más lejos y arranca más caliente en el centro, donde está el sol; hacia
     los lados se adelgaza y ya nace en el tono 2.
   - Encima, el planeta se rellena nítido a resolución completa, con un borde fino
     (claro donde está el sol, del color lateral hacia los lados) y una bruma leve
     justo dentro del filo.
   - El movimiento no es un borde que sube: es la curva que se aplana, como si
     bajaras hacia el planeta. A la salida el filo cuelga de arriba, se enciende
     primero por las esquinas y se endereza en un resplandor plano sobre la
     sección siguiente.

   Ajustes por transición (atributos del .hz-gap):
     data-round   curvatura del horizonte (1 por defecto)
     data-reach   alto del resplandor (1 por defecto)
     data-length  scroll que ocupa, en pantallas (0.9 por defecto)
   La rampa de color viene de window.TRIVENI_SUN (assets/palette.js). */
(function(){
  'use strict';
  var SC = 4;                                   /* el resplandor se calcula a 1/4 */
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clamp(x,a,b){ return x<a?a:x>b?b:x; }
  function lerp(a,b,t){ return a+(b-a)*t; }
  function sm(a,b,x){ x = clamp((x-a)/(b-a),0,1); return x*x*(3-2*x); }
  function mix(a,b,t){ return [lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)]; }
  function rgba(c,a){ return 'rgba('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+','+a+')'; }

  var NZ = new Float32Array(4096);            /* tesela de ruido 64x64 contra el bandeo */
  for(var i=0;i<4096;i++) NZ[i] = Math.random()-.5;

  /* Rampa de color: 256 pasos RGBA desde el borde (0) hasta que se apaga (1). */
  function buildRamp(f){
    var S = [[0,f.core,1],[.045,mix(f.core,f.a,.55),.98],[.18,f.a,.9],[.48,f.b,.66],[.78,f.c,.32],[1,f.c,0]];
    var L = new Uint8ClampedArray(256*4), k = 0;
    for(var n=0;n<256;n++){
      var t = n/255;
      while(k < S.length-2 && t > S[k+1][0]) k++;
      var u = clamp((t-S[k][0])/(S[k+1][0]-S[k][0]),0,1); u = u*u*(3-2*u);
      var c = mix(S[k][1],S[k+1][1],u), a = lerp(S[k][2],S[k+1][2],u);
      L[n*4] = c[0]; L[n*4+1] = c[1]; L[n*4+2] = c[2]; L[n*4+3] = a*255;
    }
    return L;
  }

  /* ---------------- Escenario: dos capas (resplandor 1/4 + planeta nítido) ---------------- */
  function Stage(host, fam, o){
    o = o || {};
    this.host = host; this.fam = fam; this.ramp = buildRamp(fam);
    this.fillA = o.fillA || '#06030a'; this.fillB = o.fillB || this.fillA;
    this.glow = document.createElement('canvas'); this.glow.className = 'hz-glow';
    this.pl = document.createElement('canvas');   this.pl.className = 'hz-planet';
    host.appendChild(this.glow); host.appendChild(this.pl);
    this.gctx = this.glow.getContext('2d'); this.pctx = this.pl.getContext('2d');
    this.resize();
  }
  Stage.prototype.resize = function(){
    var W = this.host.clientWidth || window.innerWidth, H = this.host.clientHeight || window.innerHeight;
    this.W = W; this.H = H;
    var gw = this.gw = Math.max(8, Math.ceil(W/SC)), gh = this.gh = Math.max(8, Math.ceil(H/SC));
    this.glow.width = gw; this.glow.height = gh;
    this.img = this.gctx.createImageData(gw, gh);
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.pl.width = Math.round(W*this.dpr); this.pl.height = Math.round(H*this.dpr);
    this.cc = new Float32Array(gw);
    for(var x=0;x<gw;x++){ var u = (x+.5)/gw*2-1; this.cc[x] = 1-u*u; }
    /* estrellas fijas (semilla simple) */
    var s = 7, rnd = function(){ s = (s*16807) % 2147483647; return s/2147483647; };
    this.stars = [];
    for(var i=0;i<70;i++) this.stars.push([rnd(), rnd(), .6+rnd()*1.1, .25+rnd()*.55]);
  };

  /* s = { dir:+1 planeta abajo | -1 planeta arriba, base (fracción de alto en las esquinas),
           bulge (altura de la curva), heat (0-1), reach (alto del resplandor), cover } */
  Stage.prototype.draw = function(s){
    var W = this.W, H = this.H, gw = this.gw, gh = this.gh, dir = s.dir;
    var cc = this.cc, L = this.ramp, d = this.img.data;

    /* 1) resplandor a 1/4 */
    d.fill(0);
    if(!s.cover && s.heat > .002){
      for(var x=0;x<gw;x++){
        var c = cc[x];
        var Y = (dir > 0 ? s.base - s.bulge*c : s.base + s.bulge*c) * gh;
        var R = s.reach * gh * (.4 + .6*Math.pow(c,.65));
        var so = Math.pow(1-c,1.25) * .42;               /* hacia los lados ya nace en el tono 2 */
        var hx = s.heat * (.62 + .38*c);
        var j0, j1;
        if(dir > 0){ j0 = Math.max(0, Math.floor(Y-R)); j1 = Math.min(gh-1, Math.ceil(Y+2)); }
        else       { j0 = Math.max(0, Math.floor(Y-2)); j1 = Math.min(gh-1, Math.ceil(Y+R)); }
        for(var j=j0;j<=j1;j++){
          var dd = dir*(Y-(j+.5));
          if(dd < -2) continue;
          if(dd < 0) dd = 0;
          var t = dd/R; if(t >= 1) continue;
          var k = so + t*(1-so);
          var idx = (k*255 + NZ[((j&63)<<6)|(x&63)]*2.2) | 0;
          if(idx < 0) idx = 0; else if(idx > 255) idx = 255;
          var o = idx*4, a = L[o+3]*hx; if(a <= 0) continue;
          var p = (j*gw+x)*4;
          d[p] = L[o]; d[p+1] = L[o+1]; d[p+2] = L[o+2]; d[p+3] = a;
        }
      }
    }
    this.gctx.putImageData(this.img,0,0);

    /* 2) planeta nítido a resolución completa */
    var ctx = this.pctx, dpr = this.dpr, f = this.fam;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,W,H);
    if(s.cover){ ctx.fillStyle = this.fillA; ctx.fillRect(0,0,W,H); return; }

    var y0 = s.base*H, yc = (dir > 0 ? s.base-2*s.bulge : s.base+2*s.bulge)*H;
    var yEdge = function(x){ var u = x/W*2-1; return (dir > 0 ? s.base - s.bulge*(1-u*u) : s.base + s.bulge*(1-u*u))*H; };

    /* estrellas del lado del cielo, que se apagan donde hay luz */
    var R0 = s.reach*H;
    for(var i=0;i<this.stars.length;i++){
      var st = this.stars[i], sx = st[0]*W, sy = st[1]*H, e = yEdge(sx), dist = dir*(e-sy);
      if(dist < 6) continue;
      var lit = s.heat*Math.max(0,1-dist/R0);
      var al = st[3]*(1-Math.min(1,lit*1.1))*(.4+.6*Math.min(1,s.heat*3+.2));
      if(al < .03) continue;
      ctx.fillStyle = rgba(f.core,al); ctx.fillRect(sx,sy,st[2],st[2]);
    }

    /* cuerpo del planeta */
    var far = dir > 0 ? H+4 : -4;
    ctx.beginPath(); ctx.moveTo(-2,y0); ctx.quadraticCurveTo(W/2,yc,W+2,y0); ctx.lineTo(W+2,far); ctx.lineTo(-2,far); ctx.closePath();
    var g;
    if(dir > 0){ g = ctx.createLinearGradient(0,Math.min(y0,yc/2+y0/2),0,H); g.addColorStop(0,this.fillA); g.addColorStop(1,this.fillB); }
    else { g = this.fillA; }
    ctx.fillStyle = g; ctx.fill();

    /* bruma leve justo dentro del filo */
    ctx.save(); ctx.clip();
    ctx.lineCap = 'butt';
    var hz = clamp(s.heat*1.4+.25,0,1);
    ctx.beginPath(); ctx.moveTo(-2,y0); ctx.quadraticCurveTo(W/2,yc,W+2,y0);
    for(var q=0;q<9;q++){ ctx.lineWidth = 2*(6+q*q*1.1); ctx.strokeStyle = rgba(f.rim,.014*hz); ctx.stroke(); }
    ctx.restore();

    /* borde fino: claro donde está el sol, del color lateral hacia los lados */
    var rg = ctx.createLinearGradient(0,0,W,0);
    rg.addColorStop(0,   rgba(f.rim,.55*hz+.1));
    rg.addColorStop(.22, rgba(f.rim,.8*hz+.1));
    rg.addColorStop(.5,  rgba(f.core,.95));
    rg.addColorStop(.78, rgba(f.rim,.8*hz+.1));
    rg.addColorStop(1,   rgba(f.rim,.55*hz+.1));
    ctx.beginPath(); ctx.moveTo(-2,y0); ctx.quadraticCurveTo(W/2,yc,W+2,y0);
    ctx.lineWidth = 1.15; ctx.strokeStyle = rg; ctx.stroke();
    var cg = ctx.createLinearGradient(W*.3,0,W*.7,0);
    cg.addColorStop(0,rgba(f.core,0)); cg.addColorStop(.5,rgba(f.core,.55*s.heat)); cg.addColorStop(1,rgba(f.core,0));
    ctx.lineWidth = 2.6; ctx.strokeStyle = cg; ctx.stroke();
  };

  /* ---------------- Estado de cada transición según el progreso p (0..1) ---------------- */
  function trState(p, rnd, rch){
    if(p <= 0 || p >= 1) return null;
    var q, e;
    if(p < .5){
      q = p/.5; e = q*q*(3-2*q)*.55 + q*.45;
      var bulge = (.05 + .41*Math.pow(1-q,1.3))*rnd, ymid = lerp(1.05,-.1,e);
      if(q > .995) return { cover:true };
      return { dir:1, base:ymid+bulge, bulge:bulge, heat:sm(0,.2,q)*.9, reach:lerp(.56,.72,q)*rch };
    }
    q = (p-.5)/.5;
    if(q < .06) return { cover:true };
    var q2 = (q-.06)/.94; e = q2*q2*(3-2*q2)*.5 + q2*.5;
    return { dir:-1, base:lerp(1.04,0,e), bulge:.3*Math.pow(1-q2,1.2)*rnd,
             heat:sm(0,.22,q2)*(1-sm(.62,1,q2))*.9, reach:lerp(.72,.34,q2)*rch };
  }

  /* ---------------- Controlador ---------------- */
  var trs = [], hero = null, raf = 0, lastW = 0, lastH = 0;

  function makeTransition(gap, idx){
    var fam = (window.TRIVENI_SUN || [])[idx+1];
    if(!fam) return;
    var t = { gap:gap, fam:fam, p:-1, shown:false, settled:false,
      round: parseFloat(gap.getAttribute('data-round')) || 1,
      reach: parseFloat(gap.getAttribute('data-reach')) || 1,
      len:   parseFloat(gap.getAttribute('data-length')) || .9,
      next:  document.getElementById(gap.getAttribute('data-next')),
      stage: null, label: null };
    if(reduce){
      /* sin movimiento: un resplandor plano y fijo entre secciones */
      gap.style.height = '16vh'; gap.classList.add('static');
      var host = document.createElement('div'); host.className = 'hz-static'; host.setAttribute('aria-hidden','true'); gap.appendChild(host);
      t.stage = new Stage(host, fam, { fillA:'#06030a' });
      t.stage.draw({ dir:-1, base:0, bulge:0, heat:.6, reach:.62 });
      settle(t);
    }
    trs.push(t);
  }

  function ensureStage(t){
    if(t.stage) return;
    var host = document.createElement('div');
    host.className = 'hz-stage'; host.setAttribute('aria-hidden','true');
    host.innerHTML = '<div class="hz-label"><span class="hz-roman">' + (t.gap.getAttribute('data-roman')||'') + '</span><span class="hz-name">' + (t.gap.getAttribute('data-title')||'') + '</span></div>';
    document.body.appendChild(host);
    t.host = host; t.label = host.querySelector('.hz-label');
    t.stage = new Stage(host, t.fam, { fillA:'#06030a' });
  }

  function settle(t){
    if(t.settled) return; t.settled = true;
    if(t.next){ t.next.classList.add('settled'); document.dispatchEvent(new CustomEvent('hz:settled',{ detail:t.next })); }
  }

  function sizeGaps(){
    var V = window.innerHeight;
    trs.forEach(function(t){ if(!reduce) t.gap.style.height = Math.round(t.len*V) + 'px'; });
  }

  function frame(){
    raf = 0;
    var V = window.innerHeight;
    for(var i=0;i<trs.length;i++){
      var t = trs[i]; if(reduce) continue;
      var G = t.gap.offsetHeight, r = t.gap.getBoundingClientRect();
      var p = (V - r.top)/(V + G);
      if(p >= .985) settle(t);
      if(p > 0 && p < 1){
        ensureStage(t);
        if(!t.shown){ t.host.style.visibility = 'visible'; t.shown = true; t.p = -1; }
        if(Math.abs(p - t.p) > 1e-4){
          t.p = p;
          var s = trState(p, t.round, t.reach);
          if(s) t.stage.draw(s);
          t.label.style.opacity = (sm(.41,.47,p)*(1-sm(.5,.57,p))).toFixed(3);
          t.label.style.transform = 'translateY(' + ((1-sm(.41,.5,p))*14 - sm(.5,.57,p)*10).toFixed(1) + 'px)';
        }
      } else if(t.shown){
        t.host.style.visibility = 'hidden'; t.shown = false; t.p = -1;
      }
    }
  }
  function req(){ if(!raf) raf = requestAnimationFrame(frame); }

  function onResize(){
    var w = window.innerWidth, h = window.innerHeight;
    if(w === lastW && Math.abs(h-lastH) < 110) return;   /* barra de direcciones móvil */
    lastW = w; lastH = h;
    sizeGaps();
    trs.forEach(function(t){ if(t.stage){ t.stage.resize(); t.p = -1; } });
    if(hero) hero.resize();
    req();
  }

  /* ---------------- Amanecer del hero ---------------- */
  function Hero(host, fam){
    this.stage = new Stage(host, fam, { fillA:'#06030a', fillB:'#10090D' });
    this.t0 = 0; this.done = reduce; this.visible = true; this.last = 0;
    var self = this;
    if('IntersectionObserver' in window) new IntersectionObserver(function(e){ self.visible = e[0].isIntersecting; if(self.visible) self.loop(); }).observe(host.parentNode);
    this.loop = function(){ if(self._r) return; self._r = requestAnimationFrame(function(n){ self._r = 0; self.tick(n); }); };
    this.tick = function(now){
      if(!this.t0) this.t0 = now;
      var k = clamp((now-this.t0)/3200,0,1), e = 1-Math.pow(1-k,3);
      if(reduce) { k = 1; e = 1; }
      var br = reduce ? 0 : Math.sin((now-this.t0)/2600)*.035;
      if(now - this.last > 30 || k < 1){ this.last = now; this.draw(e, br); }
      if(!reduce && this.visible) this.loop();
    };
    this.draw = function(e, br){
      var bulge = .075, ymid = lerp(1.12,.955,e);
      this.stage.draw({ dir:1, base:ymid+bulge, bulge:bulge, heat:(.8+br)*e, reach:.36*(.7+.3*e) });
    };
    this.resize = function(){ this.stage.resize(); this.draw(1,0); };
    this.loop();
  }

  var Horizon = {
    init: function(){
      var gaps = document.querySelectorAll('.hz-gap');
      Array.prototype.forEach.call(gaps, makeTransition);
      lastW = window.innerWidth; lastH = window.innerHeight;
      sizeGaps();
      var hh = document.getElementById('heroHz');
      if(hh && window.TRIVENI_SUN) hero = new Hero(hh, window.TRIVENI_SUN[0]);
      window.addEventListener('scroll', req, { passive:true });
      window.addEventListener('resize', onResize);
      if(document.fonts && document.fonts.ready) document.fonts.ready.then(req);
      window.addEventListener('load', req);
      req();
    }
  };
  window.Horizon = Horizon;
})();
