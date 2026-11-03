# Fase 1 — Motor de layout

## Objetivo

Una función pura `buildTreeLayout(family, options) ➜ TreeLayout` que transforma la familia en la forma del árbol. Es el corazón del proyecto: de aquí sale que cada árbol sea único.

## Salida esperada (`layout/types.ts`)

- `branches: BranchSegment[]`: cada uno con `id`, `parentBranchId`, puntos de control de una curva suave (`Vec3[]`), `radiusStart`, `radiusEnd`, `generation`, `personId` de la persona a la que lleva y `order` (para la animación de crecimiento).
- `fruits: FruitPlacement[]`: `personId`, `position`, `size`, `kind: 'blood' | 'graft'`, `anchorBranchId`.
- `roots: BranchSegment[]`: raíces decorativas.
- `leafClusters: { position: Vec3; radius: number; density: number }[]`: zonas donde irán hojas (cerca de las puntas).
- `bounds`: caja que contiene todo, para encuadrar la cámara.

## Algoritmo sugerido

1. **Tronco**: sale del suelo (y = 0) hacia arriba, con una ligera curva. La unión raíz cuelga cerca de la parte alta del tronco.
2. **Ramificación**: por cada hijo de una unión sale una rama desde el final de la rama padre. Los ángulos se reparten en abanico, más abiertos en las generaciones bajas y más verticales arriba. Se suma variación orgánica con el RNG sembrado por `personId`.
3. **Grosor (modelo de tuberías)**: `r(rama) = sqrt(Σ r(hijas)²)`, con un radio mínimo en las puntas. El tronco queda grueso de forma natural.
4. **Largo**: decrece con la generación (p. ej. ×0.75 por nivel), con un mínimo para que se lea.
5. **Curvas**: cada rama es una CatmullRom de 3–5 puntos con ruido suave perpendicular a su dirección.
6. **Frutos**: en la punta de cada rama de sangre. Los injertos van al lado, a una distancia fija, en la misma rama.
7. **Profundidad**: el árbol es casi plano (eje z pequeño, ±10 % del ancho) para leerse de frente, con algo de z para tener paralaje.
8. **Anti-solapamiento**: un paso de relajación que separa frutos más cercanos que `minFruitDistance` ajustando los ángulos de las ramas, no moviendo los frutos a mano.
9. **Raíces**: 5–8 raíces decorativas, también deterministas.

## Herramienta de depuración

Una vista de desarrollo (`?debug=layout`) que dibuja el layout con líneas y puntos simples (`Line` de drei) para iterar la forma sin estética.

## Tests

- Determinismo: dos llamadas ⇒ salida idéntica.
- Cada persona de sangre tiene exactamente una rama; cada injerto, un fruto anclado.
- El radio de una rama padre es ≥ al de cualquiera de sus hijas.
- No hay frutos a menos de `minFruitDistance`.
- Rendimiento: 150 personas sintéticas en < 50 ms.

## Criterios de terminado

- [ ] Tests en verde.
- [ ] `?debug=layout` muestra un árbol con forma creíble y sin frutos encimados para los datos de ejemplo.
- [ ] Cambiar un `id` cambia ligeramente la forma; recargar no la cambia.

## Prompt para Claude Code

```
Fase 1: lee docs/fases/fase-1-layout.md. Implementa el motor de layout en src/layout/ como TypeScript puro con tests, más la vista ?debug=layout.
Prioriza que la forma se vea orgánica y equilibrada. Después de implementarlo, ajusta los parámetros en config/constants.ts hasta que el árbol de ejemplo se vea bien y explícame qué parámetros controlan qué aspecto.
```
