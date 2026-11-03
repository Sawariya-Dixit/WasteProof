import { JUDGE } from '../config/defaults.js';

// Rekognition labels se waste judge. Har attribute: 'yes' | 'no' | 'uncertain'.
// Site ko verify KABHI nahi karta (wo 10 log karte hain).
const score = (labels, names) =>
  labels
    .filter((l) => names.includes(l.name) && l.conf >= JUDGE.minConf)
    .reduce((m, l) => Math.max(m, l.conf), 0);

const grade = (strong, weak = 0) => {
  if (strong >= JUDGE.strongConf) return 'yes';
  if (strong >= JUDGE.minConf || weak >= JUDGE.weakConf) return 'uncertain';
  return 'no';
};

export function judgeFromLabels(labels, type) {
  const garbage = grade(score(labels, JUDGE.garbage), score(labels, JUDGE.garbageWeak));
  const bin = grade(score(labels, JUDGE.bin));
  const water = grade(score(labels, JUDGE.water));
  const construction = grade(score(labels, JUDGE.construction));

  let verdict;
  switch (type) {
    case 'overflowing_bin':
      if (garbage === 'yes' && bin === 'yes') verdict = 'yes';
      else if (garbage === 'no' && bin === 'no') verdict = 'no';
      else verdict = 'uncertain';
      break;
    case 'contaminated_water':
      verdict = water;
      break;
    case 'open_construction':
      verdict = construction;
      break;
    default: // waste_dump, no_bin
      verdict = garbage;
  }
  return { verdict, attributes: { garbage, bin, water, construction } };
}