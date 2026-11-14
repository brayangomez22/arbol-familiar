# Fase 8 — Pulido y lanzamiento

## Objetivo

Que funcione bien en el celular del abuelo y que se vea profesional en el portafolio.

## Alcance

### Rendimiento

- Niveles de calidad en `quality.ts` (alto/medio/bajo) controlados por `PerformanceMonitor` de drei: DPR, cantidad de hojas, partículas, sombras, bloom y DOF.
- Code splitting: el mapa y el visor de fotos se cargan con lazy.
- Texturas comprimidas y fotos `.webp` con tamaños responsivos.
- Meta: ≥ 45 fps en un Android de gama media; carga inicial < 3 s en 4G.

### Carga

- Pantalla de carga ilustrada (una semilla que late) con progreso real (`useProgress` de drei), que conecta sin corte con la intro.

### Accesibilidad

- `ui/AccessibleList`: vista alternativa en lista jerárquica (botón "Ver como lista") navegable con teclado y lector de pantalla, con las mismas fichas.
- Contraste AA en la UI, foco visible y `aria-label` en los controles.
- `prefers-reduced-motion` revisado en todo el sitio.
- Fallback si no hay WebGL: mostrar la lista directamente con un mensaje amable.

### Calidad de portafolio

- `README.md` con GIF/captura, explicación de la arquitectura (diagrama de capas), las decisiones técnicas (layout determinista, modelo de tuberías, shaders de viento, crecimiento y savia) y cómo agregar personas.
- Open Graph (imagen y descripción) para que se vea bien al compartirlo por WhatsApp.
- Favicon con la hoja o la semilla.
- Opción de privacidad: build "demo" con datos ficticios para el portafolio (`VITE_DATA=demo`) y build "familia" con los datos reales.

### Despliegue

- Vercel, Netlify o GitHub Pages. CI con GitHub Actions: lint, test, validate:family y build en cada push.

## Pendientes heredados de fases anteriores

Cada fase anota aquí lo que detectó y le corresponde a esta. Inclúyelos en la auditoría inicial.

- **(Fase 0) Bundle principal de ~1,1 MB (312 KB gzip)**, casi todo three + R3F + drei; Vite avisa "chunks larger than 500 kB". Medir con un analizador del bundle y separar lo que no se necesita en el primer render (vendor chunk para three, lazy para mapa/visor/postprocessing).
- **(Fase 0) Aviso en consola `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`** Viene de R3F 9.8.2 con three 0.187, no de nuestro código. Revisar si una versión nueva de R3F lo corrige; si no, documentarlo como conocido.

## Estado

### Auditoría inicial (antes de los cambios)

| Prioridad | Hallazgo |
| --- | --- |
| P0 | La calidad nunca bajaba: sin `PerformanceMonitor`, tier fijo en `high` (DPR 2, DOF, bloom) también en celulares. |
| P0 | Un solo chunk de 1,86 MB (575 KB gzip): zod con todos sus idiomas, postprocessing, n8ao (sin usar, entraba por `@react-three/postprocessing`), mapa, visor y modo foto. |
| P0 | Sin pantalla de carga: página en blanco hasta parsear todo el JS. |
| P0 | Sin fallback de WebGL ni error boundary: página en blanco si la escena falla. |
| P0 | Sin lista accesible (regla 9). |
| P0 | Overlay con `aria-hidden` y botones enfocables durante la intro. |
| P1 | El canvas seguía dibujando detrás del mapa. Sin Open Graph, `description`, `theme-color` ni `apple-touch-icon`. Sin build demo, CI ni README. |
| P2 | Respaldo global de `prefers-reduced-motion` en CSS; `quality.shadows` sin uso. |

### Qué se hizo

- **Calidad adaptativa:** tier inicial según el dispositivo (`state/qualityTier.ts`, con tests) y `scene/quality/QualityDirector.tsx` con `PerformanceMonitor` (meta 45 fps; un tier que fue lento no se reintenta). `?quality=` lo fija.
- **Bundle:** `Effects` reescrito sobre `postprocessing` directo y cargado lazy solo en tiers con efectos (adiós `@react-three/postprocessing` y n8ao). Mapa, modo foto, visor de fotos y lista son lazy. Vendor chunks `three`, `react` y `r3f`. zod fuera de producción: `tooling/familyData.ts` valida en el build y lo detiene si falla. **Carga inicial: 575 → ~462 KB gzip**, postprocessing (76 KB) solo donde se usa.
- **Carga:** semilla que late en `index.html` (primer pintado sin JS). `ui/Loader/BootLoader` la llena con hitos reales (código, fuentes, `useProgress`, primer frame compilado) y la funde justo cuando cae la semilla de la intro.
- **Accesibilidad:** `ui/AccessibleList/` ("Ver como lista"): lista jerárquica con lugar de nacimiento y la misma `PersonCard`, foco que entra a la ficha y vuelve a la persona, Escape por pasos. Sin WebGL (o con `?lista`) es la página completa con un mensaje amable; si la escena falla, `SceneErrorBoundary` la muestra. Overlay con `inert` durante la intro, landmark `<main>`, canvas `aria-hidden`, el foco vuelve al cerrar el mapa y la lista, y un respaldo global de movimiento reducido.
- **Pausa:** `frameloop="never"` con el mapa o la lista abiertos.
- **Portafolio:** Open Graph y descripción desde los datos, `theme-color`, `apple-touch-icon`, una imagen OG por set de datos (`src/data/og-image.jpg`, `src/data/demo/og-image.jpg`), build demo (`pnpm build:demo`, familia ficticia, sin `media/people`), README, CI y despliegue de la demo en GitHub Pages.

### Medido (build demo, Chromium)

- **Lighthouse móvil:** Accesibilidad **100**, Buenas prácticas **100**, SEO **100**. La categoría Performance no se pudo correr aquí.
- **Traza con CPU 4× y Slow 4G:** LCP 2,2 s (la semilla), CLS 0. El servidor de prueba no comprimía (1,6 MB transferidos); con gzip el JS inicial son ~462 KB.
- **Verificado:** carga → intro, tier `low` sin chunk de efectos, lista accesible con teclado (abrir, elegir, Escape ×2, foco de vuelta), `?lista` en escritorio y 390 px, enlaces `#persona` en la lista, y que la demo no contiene nombres ni fotos reales.

### Pendientes

- **Criterios por verificar a mano:** Lighthouse Performance móvil en la URL desplegada (con compresión), ≥ 45 fps en un Android de gama media, pruebas en iOS Safari y Android Chrome.
- **Despliegue "familia":** elegir el hosting (Netlify, Vercel o Cloudflare Pages) y definir `VITE_SITE_URL`. La demo sale sola a GitHub Pages cuando se active la fuente "GitHub Actions" en el repo.
- **GIF para el README:** hay capturas; un GIF de la intro conviene grabarlo a mano en un equipo con GPU.
- **Conocido:** aviso `THREE.Clock` de R3F 9.8.2 (la última versión); documentado en el README.
- **Pájaro:** confirmado como decorativo, sin equivalente en la lista.
- **Test intermitente:** `buildTreeLayout.test.ts › builds a 150-person family in under 50 ms` falla de vez en cuando con la máquina cargada (≈1 de cada 4 corridas aquí, con builds y Chromium abiertos). En los runners de CI podría dar falsos rojos; si pasa, subir el margen o correrlo aparte.

## Criterios de terminado

- [ ] Lighthouse: Performance ≥ 80 en celular y Accesibilidad ≥ 95.
- [ ] Probado en iOS Safari, Android Chrome y escritorio.
- [ ] Dos despliegues: demo pública (portafolio) y familia (enlace para compartir).

## Prompt para Claude Code

```
Fase 8: lee docs/fases/fase-8-lanzamiento.md. Empieza con una auditoría de rendimiento y accesibilidad del estado actual y dame una lista priorizada. Después implementa todo y prepara el README de portafolio y el CI.
```
