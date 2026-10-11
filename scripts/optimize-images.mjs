// Crea una copia WebP ridimensionata (<file>.opt.webp) delle immagini della
// homepage caricate da Keystatic. Sul worker Cloudflare le immagini non vengono
// convertite a runtime, quindi l'ottimizzazione va fatta prima della build.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'src/assets/images/home';
const LIMITS = {
  team: { width: 1400 },
  sedi: { width: 400 },
  clienti: { height: 180 },
};

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.warn('[optimize-images] sharp non disponibile: immagini lasciate come sono');
  process.exit(0);
}

const walk = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        return e.isDirectory() ? walk(p) : [p];
      })
    : [];

let created = 0;
for (const [folder, limit] of Object.entries(LIMITS)) {
  for (const file of walk(path.join(ROOT, folder))) {
    if (!/\.(png|jpe?g|gif|webp)$/i.test(file) || file.endsWith('.opt.webp')) continue;
    const out = `${file}.opt.webp`;
    if (fs.existsSync(out) && fs.statSync(out).mtimeMs >= fs.statSync(file).mtimeMs) continue;

    const { width = 0, height = 0 } = await sharp(file).metadata();
    const tooBig = (limit.width && width > limit.width) || (limit.height && height > limit.height);
    if (file.toLowerCase().endsWith('.webp') && !tooBig) continue;

    await sharp(file)
      .resize({ ...limit, withoutEnlargement: true })
      .webp({ quality: 82, alphaQuality: 90 })
      .toFile(out);
    created++;
  }
}
console.log(`[optimize-images] ${created} immagini convertite in WebP`);
