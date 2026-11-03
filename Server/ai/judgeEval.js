import { JUDGE } from '../config/defaults.js';
import { judgeFromLabels } from './visionJudge.js';
import { decide } from './decision.js';

// items = [{ file, expected: 'waste' | 'clean', type, labels: [{name,conf}], llm?: {verdict} }]
// Pure functions: AWS/Groq nahi bulate, isliye threshold tuning bina paise kharch kiye ho jati hai.

export function decideItem(item, { useLlm = true } = {}) {
  const labels = judgeFromLabels(item.labels ?? [], item.type);
  const llm = useLlm && item.llm?.verdict ? item.llm : null;
  return { labels, llm, ...decide({ labels, llm }) };
}

// waste photo: passed = sahi, needs_reporter_confirm = chalega, rejected = GALAT (false reject)
// clean photo: rejected = sahi, needs_reporter_confirm = chalega, passed = GALAT (false accept)
export function evaluate(items, opts) {
  const rows = items.map((it) => {
    const d = decideItem(it, opts);
    const outcome =
      d.status === 'needs_reporter_confirm'
        ? 'confirm'
        : it.expected === 'waste'
          ? d.status === 'passed'
            ? 'right'
            : 'wrong'
          : d.status === 'rejected'
            ? 'right'
            : 'wrong';
    return { ...it, decision: d.status, probability: d.probability, outcome };
  });

  const waste = rows.filter((r) => r.expected === 'waste');
  const clean = rows.filter((r) => r.expected === 'clean');
  const count = (list, o) => list.filter((r) => r.outcome === o).length;
  const pct = (n, d) => (d ? Math.round((n / d) * 100) : null);

  return {
    rows,
    total: rows.length,
    falseRejects: count(waste, 'wrong'), // asli kachra reject hua
    falseAccepts: count(clean, 'wrong'), // bina kachre ki photo pass hui
    wasteTotal: waste.length,
    cleanTotal: clean.length,
    wasteRightPct: pct(count(waste, 'right'), waste.length),
    cleanRightPct: pct(count(clean, 'right'), clean.length),
    confirmPct: pct(count(rows, 'confirm'), rows.length),
  };
}

// Rekognition-label thresholds ka chhota grid search. Sabse kam (false accept + false reject) jeete.
// False accept ko thoda zyada dand (x1.5): bekaar photo map par aana zyada bura hai.
export function tuneThresholds(items, { strong = [60, 65, 70, 75, 80, 85], weak = [50, 55, 60, 65, 70] } = {}) {
  const original = { strongConf: JUDGE.strongConf, weakConf: JUDGE.weakConf };
  const results = [];
  for (const s of strong) {
    for (const w of weak) {
      if (w > s) continue; // weak, strong se upar nahi hona chahiye
      JUDGE.strongConf = s;
      JUDGE.weakConf = w;
      const r = evaluate(items, { useLlm: false });
      results.push({
        strongConf: s,
        weakConf: w,
        falseRejects: r.falseRejects,
        falseAccepts: r.falseAccepts,
        score: r.falseRejects + 1.5 * r.falseAccepts,
      });
    }
  }
  Object.assign(JUDGE, original); // JUDGE ko wapas pehle jaisa karo
  return results.sort((a, b) => a.score - b.score || a.strongConf - b.strongConf);
}

export function toMarkdown(report, { title = 'Waste judge eval' } = {}) {
  const L = [];
  L.push(`# ${title}`, '');
  L.push(`Photos: ${report.total} (waste ${report.wasteTotal}, clean ${report.cleanTotal})`, '');
  L.push('| Metric | Value |', '|---|---|');
  L.push(`| Waste photo sahi pass | ${report.wasteRightPct ?? '-'}% |`);
  L.push(`| Clean photo sahi reject | ${report.cleanRightPct ?? '-'}% |`);
  L.push(`| False reject (asli kachra reject) | ${report.falseRejects} |`);
  L.push(`| False accept (bina kachra pass) | ${report.falseAccepts} |`);
  L.push(`| Reporter se poochha gaya | ${report.confirmPct ?? '-'}% |`, '');
  const bad = report.rows.filter((r) => r.outcome === 'wrong');
  if (bad.length) {
    L.push('## Galat nikli photos', '', '| File | Expected | Decision | p | Top labels |', '|---|---|---|---|---|');
    for (const r of bad) {
      const top = (r.labels ?? [])
        .slice(0, 6)
        .map((l) => `${l.name} ${l.conf}`)
        .join(', ');
      L.push(`| ${r.file} | ${r.expected} | ${r.decision} | ${r.probability ?? '-'} | ${top} |`);
    }
  }
  return L.join('\n');
}
