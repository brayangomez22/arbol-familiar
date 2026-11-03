# Fase 7 — Extras

## Objetivo

Detalles que convierten el sitio en un recuerdo.

## Alcance

### 7.1 Mapa de orígenes

- Vista alternativa (botón "De dónde venimos") con un mapa **ilustrado** de Colombia (SVG estilizado en el mismo estilo papel; sin teselas externas, que además las bloquearía la CSP en algunos hosts).
- Un punto por lugar de `places` con la cantidad de personas nacidas ahí.
- Líneas curvas animadas de padres a hijos cuando nacieron en lugares distintos (migraciones), coloreadas por generación.
- Clic en un lugar ⇒ lista de personas ⇒ vuelve al árbol y vuela a la persona elegida.
- Si alguien nació fuera de Colombia, un recuadro lateral con un mini-mapa del mundo.

### 7.2 Música ambiental

- Pista suave en bucle (`public/audio/`), **apagada por defecto**, con botón de altavoz. Fade in/out.
- Se atenúa cuando suena una nota de voz.
- La preferencia se recuerda en localStorage (con try/catch).
- Sonidos sutiles opcionales: viento, un "pop" suave al seleccionar (todo con el mismo control).

### 7.3 Detalles sorpresa (elegir 2–3)

- Un pájaro que de vez en cuando se posa en una rama; si se toca, vuela.
- Firma escondida en el tronco ("Hecho con amor por Brayan, 2026") que aparece con zoom máximo en la corteza.
- Contador "17 personas · 4 generaciones · 88 años de historia" en el título, calculado desde los datos.
- Modo foto: oculta la UI y permite capturar la vista actual (usa el botón Copiar o abre la imagen en una pestaña nueva si el entorno no permite descargas).

## Criterios de terminado

- [ ] El mapa usa solo datos de `places` y personas; agregar un lugar no requiere tocar código.
- [ ] El audio nunca suena sin una acción del usuario.

## Prompt para Claude Code

```
Fase 7: lee docs/fases/fase-7-extras.md. Implementa el mapa de orígenes y la música ambiental. Luego propón cuáles detalles sorpresa implementar y espera mi elección.
```
