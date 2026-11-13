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

## Estado

- **Mapa de orígenes:** `domain/origins.ts` cuenta nacimientos por lugar y saca las migraciones (de cada padre o madre nacido en otro lugar al lugar de nacimiento del hijo, agrupadas por generación del hijo). `layout/originsMap.ts` proyecta lugares y contornos (`layout/geo/`), curva las líneas (ida y vuelta nunca se enciman) y elige el lado de cada nombre para no tapar otros lugares. Los lugares de `ORIGINS_MAP.homeCountry` van al mapa principal, que se agranda si alguno queda fuera del contorno (p. ej. San Andrés); los demás, al mini-mapa del mundo, que solo aparece si alguien nació fuera. UI en `ui/OriginsMap/`: diálogo nativo a pantalla completa, líneas que se dibujan por generación con una chispa que viaja de padres a hijos (estáticas con movimiento reducido), lista por lugar y vuelo a la persona al elegirla.
- **Música ambiental:** `audio/AmbientAudio.ts` (un solo grafo Web Audio: música, viento sintetizado y pop por persona en la escala de la música) y `audio/AudioDirector.tsx`, que lo maneja desde el store. Fundidos de entrada y salida, música y viento bajan ~18 dB con una nota de voz, silencio con la pestaña en segundo plano y el contexto suspendido cuando está apagado. Preferencia en localStorage (`state/audioMemory.ts`). Si quedó prendida, arranca con el primer clic o tecla de la visita, nunca al cargar.
- **La pista** (`public/audio/ambient.mp3`, 51 s, 600 KB) es sintetizada con `pnpm audio:ambient`: pad cálido y kalimba en re mayor. Es periódica, así que el bucle `AUDIO.music.loopStart/loopEnd` no tiene costura. Para usar una pista propia, reemplaza el archivo y ajusta esos dos valores (o pon el bucle en todo el archivo).

Verificado en Chromium (1280×800 y 390×844): mapa con y sin nacidos fuera de Colombia, lista por lugar y vuelo; audio medido con un analizador: no se crea contexto antes del gesto, fundido de entrada, atenuación con nota de voz, pop y suspensión al apagar.

## Pendientes para fases siguientes

- **(Fase 8) Rendimiento:** la escena 3D sigue renderizando detrás del mapa de orígenes; pausar el `Canvas` mientras está abierto ahorraría batería en celular.
- **(Fase 8) Lista accesible:** incluir los lugares de nacimiento (el mapa ya es navegable con teclado, pero la lista accesible debería tenerlos también).

## Criterios de terminado

- [x] El mapa usa solo datos de `places` y personas; agregar un lugar no requiere tocar código.
- [x] El audio nunca suena sin una acción del usuario.

## Prompt para Claude Code

```
Fase 7: lee docs/fases/fase-7-extras.md. Implementa el mapa de orígenes y la música ambiental. Luego propón cuáles detalles sorpresa implementar y espera mi elección.
```
