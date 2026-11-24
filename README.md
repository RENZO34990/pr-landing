# Triveni (landing)

Landing de Triveni (Club Kongzhi UNMSM). Sitio estático, sin build.

- Tres capítulos: I Presentación, II Los volúmenes, III El departamento.
- Entre capítulos hay una transición de amanecer orbital (`assets/horizon.js`). Ajustes por transición en el `.hz-gap`: `data-round` (curvatura), `data-reach` (alto del resplandor), `data-length` (pantallas de scroll).
- Los colores de cada amanecer cambian en cada carga, dentro de las familias definidas en `assets/palette.js` (oro, brasa, jade, rosa, amatista).
- Mezcla de paletas (`assets/blend.js`): cada sección declara `data-bg`, `data-fg`, `data-body`, `data-muted` (y opcional `data-at`, `data-span`). Cada frontera tiene su propio valor 0-1, nunca mayor que el de la anterior, y el color de la página es la suma: fondo, titulares y texto cambian juntos.
- Con `prefers-reduced-motion` la transición queda como un resplandor plano y fijo.
- Publicar: Settings > Pages > Deploy from branch > main / (root).
- Fuentes autoalojadas en assets/fonts.
