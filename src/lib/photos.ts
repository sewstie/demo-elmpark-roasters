import type { ImageMetadata } from 'astro';

const files = import.meta.glob<ImageMetadata>('../assets/photos/*.jpg', { eager: true, import: 'default' });

// Maps a file name from site.json to its astro:assets source; a missing file fails the build instead of shipping a broken image.
export function photo(file: string) {
  const found = files[`../assets/photos/${file}`];
  if (!found) throw new Error(`Photo not found: src/assets/photos/${file}`);
  return found;
}
