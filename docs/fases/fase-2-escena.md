# Fase 2 — Escena y navegación

## Objetivo

Renderizar el layout como un árbol 3D básico y navegarlo como un lienzo: arrastrar con la mano y hacer zoom.

## Alcance

- **Ramas**: `TubeGeometry` sobre la curva de cada `BranchSegment`, con radio variable del inicio al fin (geometría propia o escalado por vértice). Uniones suaves entre ramas (esfera en el nudo o solapamiento).
- **Raíces**: igual que las ramas, entrando en el suelo.
- **Frutos**: esferas o formas simples con material temporal; distinto color para sangre e injerto.
- **Nombres**: `Text` de drei bajo cada fruto, siempre de frente a la cámara (billboard). Se ocultan con fade cuando el zoom está lejos (LOD), salvo en las primeras generaciones.
- **Cámara**:
  - Perspectiva con FOV bajo (~30°), de frente al árbol.
  - `CameraControls` de drei configurado como lienzo: botón izquierdo/un dedo = pan, rueda/pellizco = zoom hacia el cursor; rotación desactivada o limitada a ±8° de paralaje.
  - Límites: no salirse del `bounds` del layout (con margen), zoom mínimo y máximo en `constants.ts`.
  - Cursor `grab` / `grabbing` en el contenedor.
  - Acción "encuadrar todo" (tecla `0` y botón).
- **Interacción básica**: hover (cursor pointer + escala) y clic en fruto ⇒ `store.select(personId)`. Clic en vacío ⇒ deseleccionar. Un arrastre no debe contar como clic.
- **Controles UI**: botones flotantes de zoom +/−/encuadrar, como en el prototipo.

## Criterios de terminado

- [ ] Se navega fluido con mouse, trackpad y táctil.
- [ ] Zoom hacia el cursor, con límites; no se puede perder el árbol de vista.
- [ ] Clic vs. arrastre se distinguen bien.
- [ ] 60 fps en un portátil normal con los datos de ejemplo.

## Prompt para Claude Code

```
Fase 2: lee docs/fases/fase-2-escena.md. Renderiza el TreeLayout en R3F dentro de src/scene/ y monta la navegación tipo lienzo con CameraControls.
Mantén scene/ desacoplado: los componentes reciben datos del layout y hablan con la UI solo vía el store.
```
