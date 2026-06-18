# Casa Rural Tres Abetos — Web

Sitio one-page para Casa Rural Tres Abetos en Becerril de la Sierra, Madrid.

## Estructura

```
casa-rural-tres-abetos/
├── index.html          ← página principal
├── styles.css          ← estilos (un solo archivo)
├── main.js             ← lógica vanilla JS (IIFE)
├── vercel.json         ← cache headers para Vercel
├── .htaccess           ← cache headers para Apache (Hostinger u otros)
├── lib/
│   ├── gsap.min.js
│   ├── ScrollTrigger.min.js
│   └── manifest.js     ← datos del brand (window.__BRAND__)
├── assets/
│   ├── img/            ← todas las fotos en WebP
│   └── photos/source/  ← originales (no se sirven, opcional borrar)
└── tools/              ← dev-only, no se despliega
```

## Despliegue en Vercel

1. Inicia un repo de GitHub con esta carpeta.
2. Conecta el repo en [vercel.com](https://vercel.com/new).
3. Vercel detecta el sitio estático automáticamente (no necesita build).
4. Tras cada push, redeploy automático.

Los `headers` de `vercel.json` aseguran que HTML/CSS/JS se revalidan en cada visita
(sin caché obsoleta tras un cambio) y que las imágenes/fuentes se cachean 30 días.

### Bumpear la versión cuando edites CSS o JS

En `index.html` cambia `?v=20260613` por la fecha del día (`?v=YYYYMMDD`) en
los `<link>` y `<script>`. Esto fuerza al navegador a descargar la versión nueva.

## Despliegue alternativo

- **Netlify / Cloudflare Pages**: arrastra la carpeta directamente. El `.htaccess`
  no se aplica, pero los `?v=` ya hacen el trabajo.
- **Hostinger / Apache**: sube por FTP. El `.htaccess` controla la caché.

## Editar contenido

- **Textos y secciones**: directamente en `index.html`.
- **Datos del brand (teléfono, redes, dirección)**: en `lib/manifest.js`.
- **Paleta de colores**: en `styles.css` (sección `1. Tokens`).
- **Fotos**: añade WebP nuevas a `assets/img/` y refiéncialas en `index.html`.

## Enlaces externos

- Airbnb: https://www.airbnb.es/s/Casa-Rural-Tres-Abetos
- WhatsApp: https://wa.me/34650966569
- Instagram: https://instagram.com/casa_rural_tres_abetos

> **Nota sobre Airbnb:** el enlace actual lleva a la búsqueda del nombre en Airbnb.
> Cuando tengas el anuncio publicado, sustituye en `index.html`, `manifest.js` y
> donde aparezca la URL `https://www.airbnb.es/s/Casa-Rural-Tres-Abetos` por la
> URL directa del anuncio (`https://www.airbnb.es/rooms/XXXXXXXX`).
