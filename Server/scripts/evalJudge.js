// Waste judge ko test photos par chalao, accuracy dekho, thresholds tune karo.
//
// Folder aisa rakho (sirf apni khichi ya open-dataset ki photos, kisi ki privacy wali nahi):
//   testphotos/waste/*.jpg   -> jinme sach me kachra hai (judge ko PASS karna chahiye)
//   testphotos/clean/*.jpg   -> bina kachre ki (judge ko REJECT karna chahiye)
//
// Use:
//   node scripts/evalJudge.js testphotos                 (sirf Rekognition labels)
//   node scripts/evalJudge.js testphotos --llm           (labels + Groq)
//   node scripts/evalJudge.js testphotos --tune          (strong/weak confidence grid search)
//   node scripts/evalJudge.js testphotos --type overflowing_bin --out docs/judge-eval.md
//
// Jawab .cache/eval.json me save hote hain, dobara chalane par AWS/Groq ke paise nahi lagte (--refresh se naya).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { REPORT_TYPES, JUDGE } from '../config/defaults.js';
import { prepareImage } from '../services/blurService.js';
import { fetchLabels } from '../ai/rekognitionScan.js';
import { judgeWithGroq } from '../ai/groqJudge.js';
import { evaluate, tuneThresholds, toMarkdown } from '../ai/judgeEval.js';
import sharp from 'sharp';

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--'));
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const type = opt('type') ?? 'waste_dump';
const outFile = opt('out');
const useLlm = flag('llm');

if (!dir || !fs.existsSync(dir) || !REPORT_TYPES.includes(type)) {
  console.error('Use: node scripts/evalJudge.js <folder> [--llm] [--tune] [--refresh] [--type <type>] [--out file.md]');
  console.error('Folder me waste/ aur clean/ subfolders chahiye. type:', REPORT_TYPES.join(', '));
  process.exit(1);
}
if (useLlm && !env.GROQ_API_KEY) {
  console.error('--llm ke liye .env me GROQ_API_KEY chahiye');
  process.exit(1);
}

const CACHE = '.cache/eval.json';
fs.mkdirSync('.cache', { recursive: true });
const cache = !flag('refresh') && fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};
const save = () => fs.writeFileSync(CACHE, JSON.stringify(cache));

const files = [];
for (const expected of ['waste', 'clean']) {
  const sub = path.join(dir, expected);
  if (!fs.existsSync(sub)) continue;
  for (const f of fs.readdirSync(sub)) {
    if (/\.(jpe?g|png|webp)$/i.test(f)) files.push({ expected, file: path.join(sub, f) });
  }
}
if (!files.length) {
  console.error('waste/ ya clean/ me koi photo nahi mili');
  process.exit(1);
}
console.log(`${files.length} photos, type=${type}, llm=${useLlm}`);

const items = [];
for (const { expected, file } of files) {
  const buf = fs.readFileSync(file);
  const sha = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
  // Pipeline jaisi hi photo bhejo: 1600 px, EXIF hata hua
  let jpeg;
  const getJpeg = async () => {
    if (!jpeg) {
      const raw = await prepareImage(buf);
      jpeg = await sharp(raw.data, { raw: { ...raw.info } }).jpeg({ quality: 85 }).toBuffer();
    }
    return jpeg;
  };

  try {
    const lk = `labels:${sha}`;
    if (!cache[lk]) cache[lk] = await fetchLabels(await getJpeg());
    let llm = null;
    if (useLlm) {
      const mk = `llm:${sha}:${type}:${env.GROQ_MODEL}`;
      if (!cache[mk]) cache[mk] = await judgeWithGroq(await getJpeg(), type);
      llm = cache[mk];
    }
    items.push({ file: path.relative(dir, file), expected, type, labels: cache[lk], llm });
    save();
  } catch (err) {
    console.warn(`SKIP ${file}: ${err.message}`);
  }
}

if (flag('tune')) {
  const top = tuneThresholds(items).slice(0, 8);
  console.log(`\nAbhi: strongConf=${JUDGE.strongConf}, weakConf=${JUDGE.weakConf}`);
  console.table(top);
  console.log('Best combo ko config/defaults.js ke JUDGE me daalo, phir dobara bina --tune ke chalao.');
}

const report = evaluate(items, { useLlm });
console.log(`\nWaste photo sahi pass: ${report.wasteRightPct}%  | Clean photo sahi reject: ${report.cleanRightPct}%`);
console.log(`False reject: ${report.falseRejects}  False accept: ${report.falseAccepts}  Reporter se poochha: ${report.confirmPct}%`);
console.table(
  report.rows.map((r) => ({ file: r.file, expected: r.expected, decision: r.decision, p: r.probability, outcome: r.outcome })),
);

if (outFile) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, toMarkdown(report, { title: `Waste judge eval (${type}, llm=${useLlm})` }));
  console.log(`Report likhi: ${outFile}`);
}
