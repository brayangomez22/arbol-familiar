# Fase 4 — Animaciones

## Objetivo

Las animaciones que hacen el sitio especial. Todo debe sentirse suave y orgánico.

## Alcance

### 4.1 Intro de crecimiento (~6–8 s, se puede saltar)

1. Cae una semilla desde arriba con un leve vaivén y "aterriza" en la colina (polvo).
2. Brota: aparece el tronco creciendo hacia arriba.
3. Las ramas crecen **generación por generación** según `order`. Técnica: uniform `uGrowth` por rama (o atributo por vértice con la distancia a lo largo de la curva); el shader descarta o encoge los vértices más allá del progreso.
4. Al llegar cada rama a su punta, el fruto aparece con un pequeño "pop" y las hojas brotan alrededor.
5. Termina en el encuadre completo y aparece la UI con un fade.

- Orquestado con un timeline GSAP en `animation/introTimeline.ts`.
- Botón "Saltar" y no repetir en visitas siguientes (localStorage con try/catch).
- Con `prefers-reduced-motion`: sin intro, fade simple.

### 4.2 Viento

- Vertex shader (`shaders/wind.glsl`) compartido por ramas, hojas y pasto: desplazamiento con ruido en el tiempo, mayor cuanto más lejos del tronco (peso por generación o atributo).
- Ráfagas ocasionales: aumentar la amplitud unos segundos con un easing suave.
- Los frutos se mecen siguiendo la punta de su rama.

### 4.3 Hover

- El fruto escala ×1.15 con un spring, el halo brilla y aparece el nombre si estaba oculto. Unas pocas partículas de luz suben.

### 4.4 Selección (clic)

- **Vuelo de cámara** a la persona (`animation/cameraFly.ts`): curva suave con un leve alejamiento a mitad del recorrido, ~1.2 s.
- **Savia de luz**: un pulso brillante viaja desde el tronco por las ramas de su linaje (`domain.lineagePath`) hasta su fruto. Shader `sap.glsl` con uniform de progreso por rama.
- **Foco**: el resto del árbol se desatura un poco y se aplica profundidad de campo enfocada en la persona.
- Al deseleccionar, todo vuelve suave.

### 4.5 Microdetalles

- Hojas que se caen de vez en cuando (pocas, cayendo con giro).
- Transiciones de la UI con la misma curva de easing que la escena (definidas en `animation/easings.ts`).

### Estado (fase 4)

Hecho y revisado en el navegador, un commit por bloque, en el orden pedido:

- **Viento (4.2):** `shaders/wind.glsl` con gemelo CPU en `scene/wind/windField.ts` para los frutos. El peso sale del alcance a lo largo de la madera (`layout/reach.ts`). Las ráfagas siguen un horario determinista (`scene/wind/gusts.ts`). Las ramas usan un contorno propio (`OutlineMaterial`), porque `<Outlines>` de drei no sigue la deformación del vertex shader.
- **Hover (4.3):** resorte a ×1,15 (`scene/spring.ts`), halo cálido por fruto sobre un material compartido (`onBeforeRender` + `uniformsNeedUpdate`) y chispas doradas (`SparkBurst`).
- **Selección (4.4):** vuelo de cámara (`animation/cameraFly.ts`), savia por el linaje (`layout/sapPath.ts` + `USE_SAP` en `toon.frag.glsl`), foco con desaturación y profundidad de campo, todo en `animation/selectionTimeline.ts`. Un clic nuevo, un arrastre o el zoom cancelan lo anterior.
- **Intro (4.1):** calendario de crecimiento en `layout/growth.ts`, `shaders/growth.glsl`, timeline en `animation/introTimeline.ts` y director en `scene/intro/`. Arranca después de `gl.compileAsync` para no dar tirones. Se puede saltar con el botón o con Escape, queda recordada en localStorage y con reduced-motion se reemplaza por un fundido. El botón del brote (arriba de los de zoom, `ui/Controls/ReplayIntroButton`) la vuelve a reproducir desde la semilla; no se muestra con reduced-motion.
- **Easings compartidos (parte de 4.5):** `animation/easings.ts`, expuestos a CSS como `--ease-standard`, `--ease-out` y `--ease-in`.

Los cuatro criterios de terminado se verificaron. Durante la intro, el peor cuadro midió 38 ms (51 fps de media en dev sobre GPU integrada, igual que la escena sin intro).

- **Hojas que caen (4.5):** `layout/fallingLeaves.ts` decide de qué grupo de hojas se suelta cada una, cuándo cae, cómo se balancea y gira, y dónde queda en el pasto, con semilla por slot y ciclo. `scene/tree/FallingLeaves.tsx` las dibuja en un `InstancedMesh` con el mismo `LeafMaterial`. Caen pocas a la vez (4 / 3 / 1 según la calidad, `fallingLeaves` en `quality.ts`), solo después de la intro y nunca con reduced-motion. Para la fase 6 (otoño y hojas doradas) basta con cambiar los colores, las esperas y la cantidad.

## Pendientes para fases siguientes

- **(Fase 4) Clic real en un fruto sin probar.** La selección se probó disparando `selectPerson` en el store; los clics simulados no llegan porque camera-controls captura el puntero. Confirmar con un clic de verdad.
- **(Fase 4) Profundidad de campo solo en calidad alta.** Con desenfoque fuerte deja un halo tenue alrededor de los nombres, por eso `bokehScale` quedó en 1,5. Revisarlo con el bloom de noche (fase 6).
- **(Fase 4) Panel de la persona (fase 5).** El vuelo deja a la persona centrada. Si la ficha se abre a un lado, desplazar el encuadre final en `SelectionDirector`.

## Criterios de terminado

- [ ] Intro completa, saltable, que no se repite y que respeta `reduced-motion`.
- [ ] El viento nunca se detiene y no causa tirones.
- [ ] El clic dispara vuelo + savia + foco de forma coordinada; clics rápidos seguidos no rompen nada (cancelar el timeline anterior).
- [ ] Sin caídas de fps notorias durante la intro.

## Prompt para Claude Code

```
Fase 4: lee docs/fases/fase-4-animaciones.md. Implementa las animaciones en este orden: viento, hover, selección (vuelo + savia + foco) y al final la intro de crecimiento.
Los shaders van en src/shaders/ y los timelines en src/animation/. Avísame al terminar cada sub-bloque para revisarlo.
```
