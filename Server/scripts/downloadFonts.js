// Use: npm run fonts   (ek hi baar; PDF ke liye Noto fonts Server/assets/fonts me aate hain)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://raw.githubusercontent.com/notofonts/notofonts.github.io/main/fonts';
const FILES = {
  'NotoSans-Regular.ttf': `${BASE}/NotoSans/hinted/ttf/NotoSans-Regular.ttf`,
  'NotoSans-Bold.ttf': `${BASE}/NotoSans/hinted/ttf/NotoSans-Bold.ttf`,
  'NotoSansDevanagari-Regular.ttf': `${BASE}/NotoSansDevanagari/hinted/ttf/NotoSansDevanagari-Regular.ttf`,
  'NotoSansDevanagari-Bold.ttf': `${BASE}/NotoSansDevanagari/hinted/ttf/NotoSansDevanagari-Bold.ttf`,
};

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/fonts');
fs.mkdirSync(dir, { recursive: true });

for (const [name, url] of Object.entries(FILES)) {
  const dest = path.join(dir, name);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 100_000) {
    console.log(`ok (pehle se hai)  ${name}`);
    continue;
  }
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`FAIL ${name}: HTTP ${res.status}\n${url}`);
    process.exit(1);
  }
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  console.log(`downloaded         ${name}`);
}
console.log('\nFonts taiyaar. Licence: SIL Open Font License (Noto).');