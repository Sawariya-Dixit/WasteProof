import { VERIFY } from '../config/defaults.js';

// sources = { labels, llm }: har ek null (available nahi) ya { verdict: 'yes'|'no'|'uncertain', ... }
// Pure function. Site ko verify YAHAN KABHI NAHI hota, wo sirf 10 log karte hain.
export function decide({ labels = null, llm = null, detectorScore = null } = {}) {
  const used = Object.entries({ labels, llm }).filter(([, j]) => j?.verdict);
  if (!used.length) return { status: 'no_judge', probability: null, verdict: null, sources: [] };

  const weightSum = used.reduce((s, [name]) => s + VERIFY.weights[name], 0);
  const probability =
    used.reduce((s, [name, j]) => s + VERIFY.weights[name] * VERIFY.verdictProb[j.verdict], 0) /
    weightSum;

  const verdicts = used.map(([, j]) => j.verdict);
  const allYes = verdicts.every((v) => v === 'yes');
  const allNo = verdicts.every((v) => v === 'no');
  const anyYes = verdicts.includes('yes');
  const verdict = allYes ? 'yes' : allNo ? 'no' : 'uncertain';
  const sources = used.map(([name]) => name);
  const base = { probability: Number(probability.toFixed(3)), verdict, sources };

  // Clear no, ya probability kam aur kisi ne 'yes' nahi kaha
  if (allNo || (probability < VERIFY.rejectBelow && !anyYes)) {
    // Detector (YOLO) pakka bole to AI akele reject na kare, community dekhe
    if (detectorScore !== null && detectorScore >= VERIFY.detectorMin) {
      return { ...base, status: 'community_check', reason: 'detector_only' };
    }
    return { ...base, status: 'rejected', reason: 'no_waste_detected' };
  }
  // Dono saaf 'yes'
  if (allYes) return { ...base, status: 'passed' };
  // Judges ki raay alag, ya uncertain: reporter se poochho (disagreement par seedha reject nahi)
  return { ...base, status: 'needs_reporter_confirm', reason: 'uncertain' };
}
