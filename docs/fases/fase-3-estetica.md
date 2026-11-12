# Fase 3 — Estética ilustrada

## Objetivo

Que deje de parecer 3D genérico y se vea como una **ilustración viva**. Ver `docs/vision.md` › Estética.

## Alcance

- **Material toon propio** (`materials/ToonMaterial`, shader en `shaders/toon.*.glsl`): 3–4 bandas de luz con una rampa de color del tema, más rim light suave.
- **Contornos**: `Outlines` de drei o un pase de postprocesado de bordes; trazo fino, color oscuro cálido (no negro puro).
- **Corteza**: textura procedural o en `public/textures/` con vetas a lo largo del tubo (UV a lo largo de la rama).
- **Hojas**: `InstancedMesh` de planos con forma de hoja (textura con alfa o geometría simple), repartidas en los `leafClusters`. Varias tonalidades del tema por instancia. Cantidad según `quality.ts`.
- **Frutos**: forma de linterna/fruto estilizado (no esfera pura), con un pequeño tallo. Color por persona (estable, sacado del tema con hash del id). Un anillo o halo suave detrás.
- **Cielo**: gradiente vertical con shader en una esfera/plano de fondo, más nubes ilustradas en capas con paralaje.
- **Suelo**: colina suave con pasto estilizado (instanced) alrededor de la base; raíces asomando.
- **Partículas**: polen/polvo flotando (instanced points).
- **Postprocesado**: textura de papel/grano multiplicada, viñeta suave, bloom sutil (más fuerte de noche en la fase 6).
- **Overlay UI** con el mismo lenguaje visual: tarjetas color papel, serif en títulos, sombras suaves.

## Pendientes heredados de fases anteriores

- **(Fase 2) El horizonte corta el árbol por la mitad.** El suelo provisional es un plano plano en y = 0 y la cámara mira a la altura del centro del árbol, así que la línea del suelo cruza la copa. La colina del alcance de esta fase debería resolverlo (o un cielo que se funda con el suelo).
- **(Fase 2) Nombres que se pisan.** Un injerto cuelga a `graftDistance` de su fruto de sangre y, con el zoom cerca, sus nombres se superponen (p. ej. Jorge Gómez y Patricia Ruiz). Revisarlo al rediseñar frutos y etiquetas: desplazar el nombre del injerto o juntar los dos nombres de la pareja.

## Criterios de terminado

- [ ] Una captura del árbol podría pasar por una ilustración.
- [ ] La paleta sale toda de `theme.ts` (cambiar el tema cambia todo).
- [ ] Sigue en 60 fps en portátil; en calidad "baja" se reducen hojas, partículas y postprocesado.

## Prompt para Claude Code

```
Fase 3: lee docs/vision.md (sección Estética) y docs/fases/fase-3-estetica.md. Implementa el estilo ilustrado.
Itera visualmente: después de cada bloque (material toon, hojas, cielo, postpro) dime qué cambiaste para que yo lo revise en el navegador antes de seguir con el siguiente.
```
