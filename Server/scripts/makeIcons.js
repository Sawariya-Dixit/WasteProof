import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const pub = path.resolve('../Client/public');
const svg = fs.readFileSync(path.join(pub, 'favicon.svg'));
const out = path.join(pub, 'icons');
fs.mkdirSync(out, { recursive: true });

const GREEN = { r: 22, g: 163, b: 74, alpha: 1 }; // #16a34a

for (const size of [192, 512]) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(path.join(out, `icon-${size}.png`));
}
// Maskable: Android icon kaat deta hai, isliye logo beech ke 60% me aur piche poora hara
{
  const size = 512;
  const logo = await sharp(svg, { density: 384 }).resize(Math.round(size * 0.6)).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: GREEN } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(path.join(out, 'maskable-512.png'));
}
await sharp(svg, { density: 384 }).resize(180, 180).png().toFile(path.join(out, 'apple-touch-icon.png'));

console.log('icons bane:', fs.readdirSync(out).join(', '));