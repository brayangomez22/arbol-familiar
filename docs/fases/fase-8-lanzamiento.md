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

## Criterios de terminado

- [ ] Lighthouse: Performance ≥ 80 en celular y Accesibilidad ≥ 95.
- [ ] Probado en iOS Safari, Android Chrome y escritorio.
- [ ] Dos despliegues: demo pública (portafolio) y familia (enlace para compartir).

## Prompt para Claude Code

```
Fase 8: lee docs/fases/fase-8-lanzamiento.md. Empieza con una auditoría de rendimiento y accesibilidad del estado actual y dame una lista priorizada. Después implementa todo y prepara el README de portafolio y el CI.
```
