---
description: Agrega una persona al árbol familiar a partir de una descripción en lenguaje natural
argument-hint: 'Ana, hija de Lucía y Pedro, nació el 3 de marzo de 2003 en Cali'
---

Agrega a la familia la persona descrita así: $ARGUMENTS

Pasos:

1. Lee `docs/datos.md` y `src/data/family.json`.
2. Identifica a quién se conecta (padres ⇒ agregar a `children` de su unión en orden de nacimiento; pareja ⇒ crear unión). Si hay ambigüedad (dos personas con el mismo nombre, padres sin unión registrada, falta saber si es de sangre o injerto), pregúntame antes de editar.
3. Crea el `id` en kebab-case (nombre-apellido, sin tildes; agrega un sufijo si ya existe).
4. Si el lugar no existe en `places`, agrégalo con sus coordenadas aproximadas.
5. Si te pasé fotos o audio, conviértelos (fotos a `.webp`, máximo 1600 px) y guárdalos en `public/media/people/<id>/`.
6. Corre `pnpm validate:family` y corrige hasta que pase.
7. Haz commit: `chore(data): agrega a <Nombre Apellido>`.
8. Respóndeme en una línea quién quedó agregado y dónde en el árbol (ej.: "Ana Álvarez, hija de Lucía y Pedro, generación 3").
