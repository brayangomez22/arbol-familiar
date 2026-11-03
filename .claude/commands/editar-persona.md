---
description: Modifica datos de una persona existente del árbol (fechas, fotos, historia, fallecimiento, pareja…)
argument-hint: "Jorge falleció en 2026" | "agrega esta foto a la abuela Rosa"
---

Aplica este cambio en la familia: $ARGUMENTS

Pasos:

1. Lee `docs/datos.md` y `src/data/family.json`.
2. Encuentra a la persona. Si hay más de una coincidencia, pregúntame cuál es.
3. Edita solo los campos necesarios. **Nunca cambies un `id` existente** (rompe enlaces compartidos).
4. Para fotos o audio nuevos: conviértelos (fotos a `.webp`, máximo 1600 px) y guárdalos en `public/media/people/<id>/`.
5. Para eliminar a una persona: confirma conmigo primero y limpia todas sus referencias en `unions`.
6. Corre `pnpm validate:family` y corrige hasta que pase.
7. Haz commit: `chore(data): <resumen corto>`.
8. Respóndeme en una línea qué cambió.
