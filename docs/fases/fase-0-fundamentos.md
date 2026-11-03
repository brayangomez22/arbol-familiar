# Fase 0 — Fundamentos

## Objetivo

Dejar el proyecto creado con herramientas, estructura de carpetas, modelo de datos validado y un lienzo 3D vacío.

## Alcance

- Proyecto Vite + React + TypeScript estricto con pnpm.
- Dependencias: three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, gsap, zustand, zod. Dev: vitest, eslint, prettier, tsx (para scripts), @types/three.
- Estructura de carpetas completa según `docs/arquitectura.md` (carpetas vacías con un `.gitkeep` si hace falta).
- ESLint con `no-restricted-imports` que impida a `src/domain/**` y `src/layout/**` importar `react`, `three`, `@react-three/*`, `src/scene/**`, `src/ui/**`.
- Alias de importación `@/` ➜ `src/`.
- `domain/types.ts`, `data/familySchema.ts` (zod) y `data/loadFamily.ts` según `docs/datos.md`.
- `scripts/validate-family.ts` con **todas** las reglas de integridad de `docs/datos.md`, expuesto como `pnpm validate:family`. Mensajes de error claros y en español.
- `family.json` de ejemplo con ~20 personas ficticias en 4 generaciones: incluir injertos, una persona con dos uniones, un fallecido, fechas parciales y alguien que cumpla años hoy (para pruebas futuras).
- `domain/dates.ts` y `domain/genealogy.ts` con tests.
- `config/theme.ts`, `config/constants.ts`, `config/quality.ts` iniciales.
- `state/store.ts` con slices vacíos tipados.
- `App.tsx` con un `<Canvas>` a pantalla completa y fondo con el color de cielo del tema.
- Fuentes (Fraunces + Inter) cargadas.

## Criterios de terminado

- [ ] `pnpm lint && pnpm test && pnpm validate:family && pnpm build` pasan.
- [ ] Romper a propósito `family.json` (id duplicado, referencia rota, ciclo) hace fallar la validación con un mensaje entendible.
- [ ] Importar `three` desde `src/layout/` marca error de lint.
- [ ] `pnpm dev` muestra el lienzo vacío con el color de fondo.

## Prompt para Claude Code

```
Vamos a empezar la Fase 0 del proyecto. Lee CLAUDE.md, docs/vision.md, docs/arquitectura.md, docs/datos.md y docs/fases/fase-0-fundamentos.md.
Primero muéstrame un plan corto con las dependencias exactas que vas a instalar y la configuración de ESLint/TS. Cuando lo apruebe, impleméntalo completo y termina verificando todos los criterios de terminado de la fase.
```
