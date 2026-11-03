# Fase 5 — Fichas y contenido

## Objetivo

Que cada persona tenga su espacio: quién es, su historia, sus fotos y su voz.

## Alcance

- **Ficha de persona** (`ui/PersonPanel`): panel lateral en escritorio y hoja inferior arrastrable en celular.
  - Nombre (serif grande), apodo, fechas con edad o "vivió X años", lugar de nacimiento.
  - Relaciones clicables: padres, pareja(s), hijos y hermanos. Al hacer clic, la cámara vuela a esa persona.
  - **Polaroids**: las fotos se apilan ligeramente rotadas; al tocar una, se abre en grande con su pie de foto. Carga diferida y placeholder borroso.
  - **Historia** (`bio`) con buena tipografía.
  - **Nota de voz**: reproductor minimalista con forma de onda simple; pausa la música ambiental (fase 7) mientras suena.
  - Sin foto: avatar ilustrado con iniciales y el color de su fruto.
- **Buscador** (`ui/Search`): tecla `/` o ícono de lupa; búsqueda difusa por nombre y apodo, sin tildes; con Enter vuela a la persona.
- **Enlaces por persona**: la selección se sincroniza con `location.hash` (`#ana-alvarez`). Al abrir un enlace con hash, después de la intro (o sin ella), vuela directo a esa persona. Botón "Copiar enlace" en la ficha.
- **Teclado**: `Esc` cierra la ficha; flechas para moverse entre padres, hijos y hermanos de la persona seleccionada.

## Criterios de terminado

- [ ] La ficha funciona bien en celular (hoja inferior) y en escritorio.
- [ ] Los enlaces `#id` abren directo a la persona.
- [ ] El buscador encuentra "lucia" ⇒ "Lucía".
- [ ] Las fotos no bloquean la carga inicial.

## Prompt para Claude Code

```
Fase 5: lee docs/fases/fase-5-fichas.md. Implementa la ficha de persona, el buscador, la navegación por teclado y los enlaces por hash.
La UI va en src/ui/ con CSS Modules y se comunica con la escena solo a través del store.
```
