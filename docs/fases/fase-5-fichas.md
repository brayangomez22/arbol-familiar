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

## Estado

- **Ficha (`ui/PersonPanel/`):** panel lateral de 400 px en escritorio y hoja inferior en pantallas de hasta 720 px (`PERSON_PANEL` en `constants.ts`). La hoja descansa a media altura, se arrastra desde arriba para ampliarla o cerrarla (un gesto rápido sigue su dirección) y la barrita de arriba también la amplía o reduce. Avatar con retrato o con las iniciales del color del fruto, nombre, apodo, fechas y edad ("unos 58 años" cuando faltan mes o día), lugar de nacimiento, "Copiar enlace", polaroids con visor (`<dialog>` nativo, flechas entre fotos), historia, nota de voz con forma de onda real (decodificada al abrir la ficha; mientras tanto, una forma sembrada) y familia con chips clicables que iluminan el fruto al pasar el puntero.
- **Encuadre junto a la ficha (pendiente de la fase 4):** la UI publica en el store cuánto tapa la ficha (`viewInset`) y `SelectionDirector` desplaza el punto al que mira la cámara para que la persona quede en el centro del espacio libre (`scene/camera/insetShift.ts`).
- **Buscador (`ui/Search/`):** lupa en la columna de botones, `/` o Ctrl/Cmd+K. Búsqueda difusa en `domain/search.ts` (sin tildes, palabras en cualquier orden, tolera un error de tecleo). El resultado activo brilla en el árbol; Enter vuela a la persona.
- **Enlaces (`app/routing.ts`):** la selección se escribe en `location.hash` con `replaceState` (recorrer el árbol no llena el botón "atrás"). Un enlace con `#id` espera a que termine la intro, o a que se salte.
- **Teclado:** `Esc` cierra la ficha; `↑` va al padre de cuya rama se sale (desde una pareja injertada, a su pareja), `↓` al hijo más cercano debajo, `←`/`→` recorren los frutos de la misma horquilla (hermanos y sus parejas) en el orden en que se ven (`domain/navigation.ts`).
- **Música (fase 7):** el store expone `voiceNotePlaying`; la música ambiental debe bajar mientras sea `true`.

Verificado en Chromium headless (escritorio 1280×800 y celular 390×844) con fotos y audio de prueba que no quedaron en el repo: enlace `#jose-gomez`, flechas, Esc, buscador "lucia" ⇒ Lucía, chips, visor, arrastre de la hoja, copiar enlace, reproducción con progreso. Ninguna foto se pide en la carga inicial. El clic real sobre un fruto selecciona a la persona y el clic en vacío la suelta (cierra el pendiente de la fase 4).

## Pendientes para fases siguientes

- **(Fase 5) Probar en un celular de verdad.** La hoja se probó con ratón emulado, no con un dedo sobre una pantalla táctil.
- **(Fase 5) La nota de voz se descarga dos veces** (metadatos del `<audio>` y la decodificación de la onda); suele salir de caché, pero se puede unificar con un `blob:`. Revisarlo en la fase 8.
- **(Fase 5) Encuadre cerca del borde.** El desplazamiento por la ficha puede chocar con el límite de la cámara (`NAVIGATION.boundaryMargin`) en las personas del extremo derecho; entonces quedan un poco tapadas.
- **(Fase 8) Lista accesible:** todo lo que ofrece la ficha ya funciona con teclado; falta la vista de lista.

## Criterios de terminado

- [x] La ficha funciona bien en celular (hoja inferior) y en escritorio.
- [x] Los enlaces `#id` abren directo a la persona.
- [x] El buscador encuentra "lucia" ⇒ "Lucía".
- [x] Las fotos no bloquean la carga inicial.

## Prompt para Claude Code

```
Fase 5: lee docs/fases/fase-5-fichas.md. Implementa la ficha de persona, el buscador, la navegación por teclado y los enlaces por hash.
La UI va en src/ui/ con CSS Modules y se comunica con la escena solo a través del store.
```
