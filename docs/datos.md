# Modelo de datos

Todo el contenido vive en `src/data/family.json`. Es **plano y normalizado**: una lista de personas y una lista de uniones (parejas con hijos). Así es fácil de editar y de validar.

## Estructura

```jsonc
{
  "meta": {
    "title": "Familia Gómez",
    "rootUnionId": "u-jose-rosa", // la pareja que forma el tronco
    "updatedAt": "2026-11-03",
  },
  "places": {
    "medellin": {
      "name": "Medellín",
      "region": "Antioquia",
      "country": "Colombia",
      "lat": 6.2442,
      "lng": -75.5812,
    },
  },
  "people": [
    {
      "id": "jose-gomez", // kebab-case, único, estable (nunca cambiarlo)
      "firstName": "José",
      "lastName": "Gómez",
      "nickname": "Don José", // opcional
      "birth": { "date": "1938-05-12", "placeId": "medellin" },
      "death": { "date": "2015" }, // opcional; si existe, la persona falleció
      "bio": "Arriero de joven, luego…", // opcional, máx. ~600 caracteres
      "photos": [
        // opcional; la primera es el retrato
        { "src": "jose-gomez/retrato.webp", "caption": "Finca, 1970", "year": 1970 },
      ],
      "audio": { "src": "jose-gomez/historia.mp3", "caption": "Cómo conoció a Rosa" }, // opcional
    },
  ],
  "unions": [
    {
      "id": "u-jose-rosa",
      "partners": ["jose-gomez", "rosa-manco"], // 1 o 2 personas
      "children": ["carlos-gomez", "lucia-gomez"], // en orden de nacimiento
      "since": "1962", // opcional
    },
  ],
}
```

## Fechas parciales

`date` acepta `"AAAA"`, `"AAAA-MM"` o `"AAAA-MM-DD"`. Si solo se sabe el año, se pone el año. Los cumpleaños (florecer) solo aplican con fecha completa.

## Conceptos

- **Persona de sangre**: aparece como hija en alguna unión, o es partner de la unión raíz. Tiene rama propia.
- **Injerto**: pareja que entra a la familia (no es hija de ninguna unión registrada). Su fruto cuelga junto al de su pareja de sangre y no genera rama propia.
- Una persona con varias parejas tiene varias uniones; cada unión con hijos genera una sub-rama desde su punta.

## Reglas de integridad (las valida `pnpm validate:family`)

1. Todos los `id` son únicos y en kebab-case.
2. Toda referencia (`partners`, `children`, `rootUnionId`, `placeId`) apunta a algo que existe.
3. Cada persona es hija de **como máximo una** unión.
4. No hay ciclos (nadie es su propio ancestro).
5. Todas las personas son alcanzables desde la unión raíz (por sangre o como injerto).
6. `death.date` ≥ `birth.date`, y los hijos nacen después que sus padres.
7. Los archivos de `photos` y `audio` existen en `public/media/people/`.
8. Advertencia (no error) si `children` no está ordenado por fecha de nacimiento.

## Ejemplos de pedidos y qué hacer

- _"Agrega a Ana, hija de Lucía y Pedro, nacida el 3 de marzo de 2003 en Cali."_ ⇒ crear `ana-alvarez` en `people` y añadir su id a `children` de la unión de Lucía y Pedro, en orden de nacimiento. Si Cali no está en `places`, agregarlo.
- _"Mateo se casó con Daniela."_ ⇒ crear a `daniela-…` y una unión nueva `u-mateo-daniela` con `children: []`.
- _"Mi tío Jorge falleció en 2026."_ ⇒ agregar `death: { "date": "2026" }` a `jorge-gomez`.
