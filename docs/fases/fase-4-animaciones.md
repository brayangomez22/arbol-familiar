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
