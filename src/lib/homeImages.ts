const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/home/**/*.{png,jpg,jpeg,gif,webp}',
  { eager: true }
);

// Preferisce la copia WebP generata da scripts/optimize-images.mjs, se esiste.
export function homeImage(path?: string | null): ImageMetadata | null {
  if (!path) return null;
  return (images[`${path}.opt.webp`] ?? images[path])?.default ?? null;
}
