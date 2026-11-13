# Arquitectura

## Capas y flujo de datos

```
family.json ──▶ data/ (carga + validación zod)
                  │
                  ▼
               domain/  (modelo y consultas genealógicas: ancestros, descendientes, edad, cumpleaños…)
                  │
                  ▼
               layout/  (familia ➜ geometría abstracta: curvas de ramas, radios, posiciones de frutos)
                  │
                  ▼
     ┌────────── scene/ (R3F: traduce geometría a meshes, materiales, shaders, cámara)
     │            ▲
 state/ (zustand) │
     │            ▼
     └────────── ui/   (overlay DOM: ficha, buscador, timeline, controles)
```

Regla de dependencia: las flechas solo van hacia abajo. `domain/` y `layout/` no conocen a nadie de arriba. `scene/` y `ui/` se comunican **solo a través de `state/`**, nunca importándose entre sí.

## Estructura de carpetas

```
arbol-familiar/
├─ CLAUDE.md
├─ docs/                          # visión, arquitectura, datos y fases
├─ .claude/commands/              # comandos personalizados de Claude Code
├─ public/
│  ├─ media/people/<person-id>/   # fotos (.webp) y audios (.mp3) por persona
│  ├─ textures/                   # papel, acuarela, ruido
│  └─ audio/                      # música ambiental
├─ scripts/
│  └─ validate-family.ts          # pnpm validate:family
└─ src/
   ├─ main.tsx
   ├─ app/
   │  ├─ App.tsx                  # compone <Experience/> + <Overlay/>
   │  └─ routing.ts               # sincroniza persona seleccionada ↔ location.hash
   ├─ data/
   │  ├─ family.json              # ÚNICA fuente de contenido
   │  ├─ familySchema.ts          # esquema zod
   │  └─ loadFamily.ts            # parsea, valida y construye el modelo de dominio
   ├─ domain/                     # TS puro + tests
   │  ├─ types.ts                 # Person, Union, Family, PartialDate…
   │  ├─ genealogy.ts             # ancestors(), descendants(), lineagePath(), generationOf()…
   │  ├─ dates.ts                 # fechas parciales, edad, isBirthday(), isAliveAt(year)
   │  └─ __tests__/
   ├─ layout/                     # TS puro + tests
   │  ├─ types.ts                 # Vec3, BranchSegment, FruitPlacement, TreeLayout
   │  ├─ random.ts                # RNG con semilla (p. ej. mulberry32 + hash del id)
   │  ├─ buildTreeLayout.ts       # punto de entrada: Family ➜ TreeLayout
   │  ├─ branchShape.ts           # curvas orgánicas, ángulos, ramificación
   │  ├─ thickness.ts             # radio por nº de descendientes (modelo de tuberías)
   │  ├─ originsMap.ts            # lugares y migraciones ➜ mapa 2D (proyección, curvas, etiquetas)
   │  ├─ geo/                     # contornos dibujados a mano: Colombia y continentes
   │  └─ __tests__/
   ├─ scene/                      # React Three Fiber
   │  ├─ Experience.tsx           # <Canvas>, luces, entorno, árbol, efectos
   │  ├─ camera/                  # CameraRig, controles pan/zoom, vuelos
   │  ├─ tree/                    # Trunk, Branch, Roots, Fruit, Leaves, Blossoms
   │  ├─ environment/             # Sky, Ground, Particles, Fireflies, DayNight
   │  ├─ effects/                 # Postprocessing (bloom, DOF, viñeta, grano de papel)
   │  └─ materials/               # materiales toon y shader materials
   ├─ shaders/                    # .glsl (wind, growth, sap, toon, paper)
   ├─ animation/                  # timelines GSAP (intro, cameraFly) y easings
   ├─ audio/                      # Web Audio: música, viento y pop; AudioDirector lo maneja desde state/
   ├─ ui/                         # componentes DOM del overlay
   │  ├─ PersonPanel/
   │  ├─ Search/
   │  ├─ Timeline/
   │  ├─ Controls/
   │  ├─ Loader/
   │  └─ AccessibleList/
   ├─ state/
   │  └─ store.ts                 # slices: selection, timeline, quality, audio, intro
   ├─ hooks/                      # useReducedMotion, useQualityTier, useNow…
   ├─ config/
   │  ├─ theme.ts                 # paletas día/noche/estaciones, tipografías
   │  ├─ constants.ts             # medidas del árbol, tiempos, límites de cámara
   │  └─ quality.ts               # niveles alto/medio/bajo
   └─ styles/                     # CSS global y variables (CSS Modules por componente)
```

## Decisiones clave

| Tema         | Decisión                                                              | Por qué                                                              |
| ------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Render       | R3F + drei                                                            | Three.js con componentes declarativos y el ecosistema de React.      |
| Animación    | GSAP para secuencias; `useFrame` + uniforms para lo continuo          | GSAP orquesta bien timelines; lo continuo (viento) vive en GPU.      |
| Estado       | zustand con selectores                                                | Evita re-renders del árbol entero al cambiar UI.                     |
| Datos        | JSON + zod                                                            | Claude Code edita JSON fácilmente y zod detecta errores al instante. |
| Etiquetas 3D | `Text` de drei (troika)                                               | Texto SDF nítido a cualquier zoom.                                   |
| Estilos UI   | CSS Modules + variables CSS de `theme.ts`                             | Sin dependencias pesadas, alcance local.                             |
| Cámara       | Ortográfica o perspectiva con FOV bajo + `CameraControls` restringido | Lectura plana tipo lienzo con algo de profundidad.                   |
| Calidad      | `PerformanceMonitor` de drei + niveles en `quality.ts`                | Bajar efectos automáticamente en celulares.                          |

## Testing

- `domain/` y `layout/`: tests unitarios obligatorios. En `layout/`, incluye tests de **determinismo** (mismo input ⇒ mismo output) y de **no superposición** de frutos.
- `scene/` y `ui/`: verificación visual manual. Opcionalmente, capturas con Playwright en fases avanzadas.
