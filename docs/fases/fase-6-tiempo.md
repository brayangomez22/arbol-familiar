# Fase 6 — Tiempo vivo

## Objetivo

Que el árbol responda al tiempo: la historia familiar, la estación, la hora y las fechas importantes.

## Alcance

### 6.1 Línea de tiempo

- Control deslizante (`ui/Timeline`) desde el nacimiento más antiguo hasta el año actual, con marcas por década.
- Al moverlo, el árbol muestra solo a quienes ya habían nacido ese año: las ramas crecen o se recogen (reusar `uGrowth` de la fase 4) y los frutos aparecen o desaparecen.
- Las personas fallecidas antes de ese año se ven en su estado de fallecido.
- Botón ▶ que recorre los años automáticamente (≈ 1 año cada 150 ms).
- Indicador grande del año actual del timeline, en serif.
- La lógica de "quién existe en el año X" vive en `domain/` y tiene tests.

### 6.2 Estaciones

- Según el mes real: paletas de hojas en `theme.ts` (primavera con brotes y flores, verano verde pleno, otoño ocres con más hojas cayendo, invierno con menos hojas y un toque frío).
- Nota: Colombia no tiene estaciones marcadas; es una decisión estética. Agregar un selector oculto en `?season=` para probar y para el portafolio.

### 6.3 Día y noche

- Según la hora local: amanecer, día, atardecer y noche, con transiciones del cielo, la luz y la paleta.
- De noche, los frutos se vuelven **linternas** que brillan (emisivo + bloom) y aparecen luciérnagas.
- `?time=night` para forzar.

### 6.4 Personas fallecidas

- Fruto de tono dorado suave con un brillo tenue.
- De vez en cuando, una hoja dorada se desprende cerca de su rama y cae despacio. Debe ser raro y sutil.

### 6.5 Cumpleaños

- Si hoy es el cumpleaños de alguien (con fecha completa): su rama se llena de flores que brotan con animación y un pequeño aviso en la UI ("Hoy cumple años Ana 🎂") que vuela a ella al tocarlo.

## Criterios de terminado

- [ ] El timeline es fluido de punta a punta y ▶ funciona.
- [ ] Las estaciones y el día/noche se pueden forzar por URL y cambian con transición.
- [ ] Los fallecidos y los cumpleaños se ven bien sin ser invasivos.
- [ ] Tests de `domain/` para existencia por año y cumpleaños (incluido el 29 de febrero).

## Prompt para Claude Code

```
Fase 6: lee docs/fases/fase-6-tiempo.md. Implementa en orden: lógica de dominio con tests, timeline, día/noche, estaciones, fallecidos y cumpleaños.
Toda la lógica de fechas va en src/domain/ y las paletas en config/theme.ts.
```
