# Triveni (landing)

Landing de Triveni (Club Kongzhi UNMSM). Sitio estático, sin build.

- Tres capítulos: I Presentación, II Los volúmenes, III El departamento.
- Entre capítulos hay una transición de amanecer orbital (`assets/horizon.js`). Ajustes por transición en el `.hz-gap`: `data-round` (curvatura), `data-reach` (alto del resplandor), `data-length` (pantallas de scroll).
- Los colores de cada amanecer cambian en cada carga, dentro de las familias definidas en `assets/palette.js` (oro, brasa, jade, rosa, amatista).
- Mezcla de paletas (`assets/blend.js`): cada sección declara `data-bg`, `data-fg`, `data-body`, `data-muted` (y opcional `data-at`, `data-span`). Cada frontera tiene su propio valor 0-1, nunca mayor que el de la anterior, y el color de la página es la suma: fondo, titulares y texto cambian juntos.
- Transiciones entre sitios (`assets/transiciones.js`, misma copia en Nalanda, Forja y Alma; `data-ink` fija el color de tinta de cada sitio): **humo** al entrar a un nivel más profundo (nace donde se hizo clic), **puerta** al volver o ir de lado (cuadrado oscuro que gira sobre las esquinas inferiores, con la marca de Triveni al centro). Los tiempos están en el objeto `CFG` del archivo. Los cuadernos entre sí conservan View Transitions.
- Pila líquida (`assets/goo.js`) en el capítulo I: los tres volúmenes forman un solo contorno que se redibuja en cada frame. Opciones en `#goo`: `data-corner` (round|square), `data-neck` (wide|pinched), `data-pull` (px para romper), `data-ease` (wobbly|calm), `data-axis` (auto|row|col). Al pasar el cursor los vecinos se apartan; al arrastrar se estira, se adelgaza y se corta; luego vuelve a crecer. Pasa a columna en pantallas angostas.
- Con `prefers-reduced-motion` la transición queda como un resplandor plano y fijo.
- Publicar: Settings > Pages > Deploy from branch > main / (root).
- Fuentes autoalojadas en assets/fonts.
