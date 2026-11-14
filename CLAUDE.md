# Árbol Familiar Vivo

Sitio web 100 % frontend que muestra el árbol genealógico de la familia Gómez como un **árbol vivo ilustrado en 3D**: el tronco son los ancestros, cada rama es un hijo y cada persona es un fruto/linterna en la punta de su rama. Es un regalo familiar y una pieza de portafolio, así que la calidad visual y la calidad del código importan por igual.

Antes de trabajar en cualquier tarea, lee:

- `docs/vision.md` — qué queremos que se sienta y se vea.
- `docs/arquitectura.md` — capas, carpetas y reglas de dependencia.
- `docs/datos.md` — modelo de datos de la familia.
- La fase en curso dentro de `docs/fases/`.

## Stack

- Vite + React + TypeScript (`strict: true`, sin `any`).
- three.js vía **React Three Fiber** y **@react-three/drei**; efectos con **postprocessing** directo (sin el wrapper de React, que arrastraba código sin usar).
- **GSAP** para timelines de animación (intro, vuelos de cámara).
- **zustand** para estado global de UI/escena.
- **zod** para validar `family.json` por script, en cada build (si falla, no hay build) y al cargar en desarrollo. Producción no lo incluye.
- **Vitest** para tests (obligatorio en `domain/` y `layout/`).
- ESLint + Prettier. Gestor de paquetes: **pnpm**.
- Instala siempre las versiones estables actuales y compatibles entre sí (revisa la compatibilidad React ↔ R3F ↔ drei antes de instalar).

No hay backend. Todo el contenido vive en `src/data/family.json` y en `public/media/`. La demo pública usa `src/data/demo/family.json` (personas ficticias); nunca pongas datos reales ahí.

## Comandos

```bash
pnpm dev              # servidor de desarrollo
pnpm build            # build "familia" (datos reales; incluye typecheck y validación)
pnpm build:demo       # build "demo" de portafolio (VITE_DATA=demo, datos ficticios, sin fotos)
pnpm test             # vitest
pnpm lint             # eslint
pnpm validate:family  # valida family.json contra el esquema y reglas de integridad
pnpm validate:demo    # lo mismo para src/data/demo/family.json
```

Antes de dar una tarea por terminada: `pnpm lint && pnpm test && pnpm validate:family && pnpm build` deben pasar.

## Reglas de arquitectura (no negociables)

1. **`src/domain/` y `src/layout/` son TypeScript puro**: no importan React, three, R3F ni nada de `scene/` o `ui/`. Están cubiertos por tests. ESLint lo hace cumplir con `no-restricted-imports`.
2. **`layout/` convierte la familia en geometría abstracta** (puntos, curvas, radios, posiciones) usando tipos propios (`Vec3` simples), no `THREE.Vector3`. `scene/` traduce eso a objetos three.
3. **La aleatoriedad es determinista**: usa el RNG con semilla de `layout/random.ts`, sembrado por el `id` de la persona. El mismo `family.json` siempre produce exactamente el mismo árbol.
4. **Nada de números mágicos**: colores en `config/theme.ts`, medidas y tiempos en `config/constants.ts`, niveles de calidad en `config/quality.ts`.
5. **Shaders en archivos `.glsl`** dentro de `src/shaders/`, importados con `?raw` (o `vite-plugin-glsl`).
6. **Componentes pequeños y con una responsabilidad.** Un componente por archivo, nombre en PascalCase igual al archivo.
7. **Estado:** zustand solo para estado compartido (persona seleccionada, año del timeline, calidad, audio). El estado de animación por frame va en refs dentro de `useFrame`, nunca en React state.
8. **Rendimiento:** usa `InstancedMesh` para hojas y partículas, reutiliza geometrías/materiales, libera recursos al desmontar, nada de `new` dentro de `useFrame`.
9. **Accesibilidad:** respeta `prefers-reduced-motion` (sin intro larga ni viento fuerte), y todo lo clicable en 3D tiene equivalente en la vista de lista accesible (fase 8).
10. **Idioma:** UI en español. Código (nombres de variables, funciones, archivos) en inglés. Comentarios solo cuando expliquen el _porqué_.

## Flujo para modificar la familia

El dueño del proyecto pedirá cosas como "agrega a mi prima Ana, hija de Lucía, nacida en 2003". Para eso:

1. Edita solo `src/data/family.json` siguiendo `docs/datos.md`.
2. Si hay fotos, van en `public/media/people/<person-id>/` en `.webp` (máx. 1600 px de lado; convierte si llegan en otro formato).
3. Corre `pnpm validate:family`. Si falla, corrige y vuelve a correr.
4. Resume en una línea qué cambió.

No toques código para agregar o editar personas. Si un pedido no cabe en el modelo de datos, dilo y propone el cambio de esquema antes de hacerlo.

Hay comandos listos: `/agregar-persona` y `/editar-persona` (en `.claude/commands/`).

## Commits

Conventional Commits en español: `feat(scene): crecimiento animado de ramas`, `fix(layout): ...`, `chore(data): agrega a Ana Gómez`. Un commit por unidad de trabajo coherente.
