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

## Estado

- **Dominio (`domain/timeline.ts`, `dayCycle.ts`, `seasons.ts`, `birthdays.ts`):** año de aparición de cada persona (si falta el nacimiento, aparece con sus padres o con su pareja, nunca antes de su rama), etapa en un año (`unborn`/`alive`/`deceased`; una muerte sin fecha solo se ve "hoy"), rango y décadas del timeline, censo por año, estación por mes, mezcla del ciclo del día por hora local y cumpleaños de hoy (el 29 de febrero se celebra el 28 en años no bisiestos). Todo con tests.
- **Timeline (`ui/Timeline/`):** barra inferior con ▶ (un año cada 150 ms), deslizador nativo con marcas por década y año grande en serif con el censo ("15 personas · 1 en el recuerdo"). El último año es "Hoy". En la escena, `layout/timelineGrowth.ts` da a cada punto de la madera el año desde el que existe (la rama crece en los 3 años previos al nacimiento) y `uTimelineYear` en `growth.glsl` hace crecer o recoger ramas y hojas, reusando el crecimiento de la intro. Los frutos aparecen al nacer y se doran al fallecer.
- **Día/noche (`scene/ambient/`):** una paleta viva de `THREE.Color` compartidos por referencia; `AmbientDirector` la interpola entre amanecer, día, atardecer y noche (paletas en `theme.ts`, horarios y números en `DAY_CYCLE`). De noche: linternas con brillo propio y bloom, estrellas, luna y luciérnagas (`environment/Fireflies.tsx`).
- **Estaciones:** hojas y pasto por estación (`seasonPalettes`), flores en la copa en primavera, más hojas cayendo en otoño, copa más rala y cielo más frío en invierno (`SEASON_LOOK`).
- **Por URL:** `?season=` (`primavera`, `verano`, `otoño`, `invierno` o en inglés) y `?time=` (`amanecer`, `día`, `atardecer`, `noche` o en inglés). Con cualquiera de los dos aparece un selector oculto arriba a la derecha que cambia el ambiente con transición y reescribe la URL.
- **Fallecidos:** fruto dorado con brillo tenue y, cada 40–90 s, una hoja dorada que cae despacio cerca de su rama (`MemorialLeafFall`).
- **Cumpleaños:** la rama de quien cumple se llena de flores que se abren de la base al fruto (`BirthdayBlossoms`) y aparece "Hoy cumple años Lucía 🎂"; el nombre vuela a la persona y el aviso se puede cerrar. No se apagan cuando hay alguien seleccionado.

Verificado en Chromium (escritorio 1280×800 y celular 390×844): recorrido de 1938 a hoy con ▶, 1970 con 8 personas, José dorado desde 2016, transición noche → atardecer, primavera, invierno, y un cumpleaños simulando la fecha del 3 de noviembre.

## Pendientes para fases siguientes

- **(Fase 6) Contornos de los frutos y de la semilla:** usan el `<Outlines>` de drei con el color de día; de noche se ven un poco cálidos. Pasarlos a `OutlineMaterial` con el color vivo si molesta.
- **(Fase 6) El test "150 personas en menos de 50 ms"** falla a veces cuando la máquina está cargada (pasa aislado). Revisar el margen en la fase 8.
- **(Fase 8) Rendimiento:** medir en celular el costo de las flores (dos mallas instanciadas) y las luciérnagas; ambas se saltan cuando no se ven.
- **(Fase 8) Lista accesible:** que muestre también el año del timeline y los cumpleaños del día.

## Criterios de terminado

- [x] El timeline es fluido de punta a punta y ▶ funciona.
- [x] Las estaciones y el día/noche se pueden forzar por URL y cambian con transición.
- [x] Los fallecidos y los cumpleaños se ven bien sin ser invasivos.
- [x] Tests de `domain/` para existencia por año y cumpleaños (incluido el 29 de febrero).

## Prompt para Claude Code

```
Fase 6: lee docs/fases/fase-6-tiempo.md. Implementa en orden: lógica de dominio con tests, timeline, día/noche, estaciones, fallecidos y cumpleaños.
Toda la lógica de fechas va en src/domain/ y las paletas en config/theme.ts.
```
