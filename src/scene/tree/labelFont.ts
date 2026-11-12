// Served from our own bundle so the 3D names never depend on a font CDN. WOFF rather than WOFF2:
// troika, which draws drei's Text, cannot parse WOFF2.
import labelFontUrl from '@fontsource/fraunces/files/fraunces-latin-500-normal.woff?url';

export { labelFontUrl };
