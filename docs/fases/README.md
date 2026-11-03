# Fases

Cada fase deja el sitio **funcionando y desplegable**. No empieces una fase sin cerrar la anterior (criterios de terminado en verde).

| #   | Fase                                          | Resultado visible                                                                              |
| --- | --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 0   | [Fundamentos](fase-0-fundamentos.md)          | Proyecto creado, datos de ejemplo validados, pantalla vacía con el lienzo.                     |
| 1   | [Motor de layout](fase-1-layout.md)           | La familia ya se convierte en la forma del árbol (probado con tests y un visor de depuración). |
| 2   | [Escena y navegación](fase-2-escena.md)       | Árbol 3D básico que se recorre con la mano y zoom.                                             |
| 3   | [Estética ilustrada](fase-3-estetica.md)      | Se ve como una ilustración: toon, papel, hojas, cielo.                                         |
| 4   | [Animaciones](fase-4-animaciones.md)          | Intro de crecimiento, viento, hover, vuelo de cámara, savia de luz.                            |
| 5   | [Fichas y contenido](fase-5-fichas.md)        | Ficha con polaroids, historia, audio; buscador; enlaces por persona.                           |
| 6   | [Tiempo vivo](fase-6-tiempo.md)               | Línea de tiempo, estaciones, día/noche, fallecidos, cumpleaños.                                |
| 7   | [Extras](fase-7-extras.md)                    | Mapa de orígenes, música ambiental, detalles sorpresa.                                         |
| 8   | [Pulido y lanzamiento](fase-8-lanzamiento.md) | Rendimiento en celular, accesibilidad, carga, despliegue, README.                              |

## Cómo usar cada fase con Claude Code

1. Abre Claude Code en la raíz del proyecto (lee `CLAUDE.md` automáticamente).
2. Pega el **prompt** del final del archivo de la fase.
3. Pídele primero un plan (o usa el modo plan). Revísalo y luego deja que implemente.
4. Verifica los criterios de terminado tú mismo en el navegador. Haz commit.
5. Si al cerrar la fase queda algo pendiente que no es de esta fase, anótalo en la sección **"Pendientes heredados de fases anteriores"** del archivo de la fase donde se va a resolver (créala si no existe), indicando de qué fase viene. Al empezar una fase, revisa esa sección y trátala como parte del alcance.
