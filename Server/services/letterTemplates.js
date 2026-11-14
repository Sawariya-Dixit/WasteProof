import { VERIFY_THRESHOLD } from '../config/defaults.js';

// Sab text yahin hai: template fallback, aur wo hisse jo server khud likhta hai (status, evidence, clauses).
// LLM sirf 'opening' aur 'request' likhta hai.

export const ISSUE_LABEL = {
  en: {
    waste_dump: 'garbage dumping',
    no_bin: 'the lack of a public dustbin',
    overflowing_bin: 'an overflowing or broken dustbin',
    contaminated_water: 'contaminated water',
    open_construction: 'open construction and demolition waste',
  },
  hi: {
    waste_dump: 'कचरा फेंके जाने',
    no_bin: 'सार्वजनिक डस्टबिन की कमी',
    overflowing_bin: 'भरे हुए या टूटे डस्टबिन',
    contaminated_water: 'दूषित पानी',
    open_construction: 'खुले में पड़े निर्माण मलबे',
  },
};

const ACTION = {
  en: {
    waste_dump: 'have the waste cleared and take steps to prevent repeated dumping',
    no_bin: 'arrange for public dustbins to be provided and regularly emptied in this area',
    overflowing_bin: 'have the dustbin emptied or repaired and its collection schedule reviewed',
    contaminated_water: 'take steps to make the water safe',
    open_construction: 'ensure the construction and demolition waste is removed and properly managed',
  },
  hi: {
    waste_dump: 'कचरा उठवाने और बार-बार कचरा फेंके जाने को रोकने के उपाय करने',
    no_bin: 'इस क्षेत्र में सार्वजनिक डस्टबिन लगवाने और उन्हें नियमित रूप से खाली करवाने',
    overflowing_bin: 'डस्टबिन को खाली या ठीक करवाने और उसके उठाव की समय-सारणी की समीक्षा करने',
    contaminated_water: 'पानी को सुरक्षित बनाने के उपाय करने',
    open_construction: 'निर्माण और तोड़फोड़ के मलबे को हटवाने तथा उसका उचित प्रबंधन सुनिश्चित करने',
  },
};

export const OFFICE_LABEL = {
  en: {
    councillor: 'Ward Councillor',
    mla: 'Member of Legislative Assembly (MLA)',
    mp: 'Member of Parliament (MP)',
    collector: 'District Collector',
  },
  hi: {
    councillor: 'वार्ड पार्षद',
    mla: 'विधायक (MLA)',
    mp: 'सांसद (MP)',
    collector: 'ज़िला कलेक्टर',
  },
};

export const fmtDate = (d, lang) =>
  d
    ? new Date(d).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

const isArea = (facts) => facts.scope !== 'site';

export function buildSubject({ lang, issueType, facts }) {
  const label = ISSUE_LABEL[lang][issueType];
  if (lang === 'hi') {
    return `कार्रवाई का अनुरोध: ${facts.placeText ? `${facts.placeText} में ` : ''}${label} की समस्या`;
  }
  return `Request for action: ${label}${facts.placeText ? ` in ${facts.placeText}` : ''}`;
}

// Template version: LLM na chale ya uska likha check me fail ho to yahi jata hai
export function templateParts({ lang, issueType, facts }) {
  const label = ISSUE_LABEL[lang][issueType];
  const action = ACTION[lang][issueType];

  if (lang === 'hi') {
    const near = facts.placeText ? `${facts.placeText} के पास ` : '';
    return {
      opening: isArea(facts)
        ? `मैं एक निवासी हूँ और ${facts.areaName} में ${label} की बार-बार मिली रिपोर्टों की ओर आपका ध्यान आकर्षित करना चाहता/चाहती हूँ। इन्हें JunkSnap नागरिक प्लेटफ़ॉर्म पर फ़ोटो, GPS लोकेशन और समय के साथ दर्ज किया गया है।`
        : `मैं एक निवासी हूँ और ${near}${label} की समस्या की ओर आपका ध्यान आकर्षित करना चाहता/चाहती हूँ। इसे JunkSnap नागरिक प्लेटफ़ॉर्म पर फ़ोटो, GPS लोकेशन और समय के साथ दर्ज किया गया है।`,
      request: `कृपया ${isArea(facts) ? 'इन स्थलों' : 'स्थल'} का निरीक्षण कराकर शीघ्र ${action} की कृपा करें तथा की गई कार्रवाई की सूचना मुझे लिखित में दें।`,
    };
  }

  const near = facts.placeText ? ` near ${facts.placeText}` : '';
  return {
    opening: isArea(facts)
      ? `I am a resident writing about repeated reports of ${label} in ${facts.areaName}. These have been documented on the JunkSnap civic platform with photographs, GPS locations and time stamps.`
      : `I am a resident writing to bring to your attention the issue of ${label}${near}. It has been documented on the JunkSnap civic platform with photographs, a GPS location and time stamps.`,
    request: `I request you to inspect ${isArea(facts) ? 'these sites' : 'the site'} and ${action} at the earliest, and to inform me in writing of the action taken.`,
  };
}

// Imaandari wali line. Hamesha server likhta hai (LLM nahi), seedhe counts se.
export function buildStatusLine({ lang, facts, siteVerified }) {
  const T = VERIFY_THRESHOLD;
  if (isArea(facts)) {
    return lang === 'hi'
      ? `यह पत्र ${facts.areaName} में इस समस्या की ${facts.totalSites} रिपोर्ट में से ${facts.verifiedSites} सामुदायिक रूप से सत्यापित रिपोर्टों पर आधारित है।`
      : `This letter is based on ${facts.verifiedSites} community-verified reports of this issue in ${facts.areaName} (out of ${facts.totalSites} reported).`;
  }
  if (siteVerified) {
    return lang === 'hi'
      ? `सामुदायिक सत्यापन पूरा हो चुका है: प्लेटफ़ॉर्म पर ${facts.backers} अलग-अलग निवासियों ने इस साइट की पुष्टि की है।`
      : `Community verification is complete: ${facts.backers} different residents have confirmed this site on the platform.`;
  }
  return lang === 'hi'
    ? `सामुदायिक सत्यापन जारी है (अब तक ${T} में से ${facts.backers} लोगों ने पुष्टि की है)।`
    : `Community verification in progress (${facts.backers} of ${T} people have confirmed so far).`;
}

const coords = (facts) =>
  Number.isFinite(facts.lat) ? `${facts.lat.toFixed(5)}, ${facts.lng.toFixed(5)}` : null;

// Evidence ki bullets (server banata hai)
export function buildEvidenceLines({ lang, facts }) {
  const hi = lang === 'hi';
  const lines = [];
  const first = fmtDate(facts.firstDate, lang);
  const last = fmtDate(facts.lastDate, lang);

  if (isArea(facts)) {
    lines.push(hi ? `दर्ज साइटें: ${facts.totalSites}` : `Sites reported: ${facts.totalSites}`);
    lines.push(
      hi
        ? `सामुदायिक रूप से सत्यापित साइटें: ${facts.verifiedSites}`
        : `Community-verified sites: ${facts.verifiedSites}`,
    );
    if (first) lines.push(hi ? `पहली रिपोर्ट: ${first}` : `First report: ${first}`);
    if (last) lines.push(hi ? `सबसे हाल की रिपोर्ट: ${last}` : `Latest report: ${last}`);
  } else {
    lines.push(
      hi ? `निवासियों द्वारा दर्ज रिपोर्ट: ${facts.reports}` : `Reports filed by residents: ${facts.reports}`,
    );
    if (first) lines.push(hi ? `पहली रिपोर्ट: ${first}` : `First reported on: ${first}`);
    const c = coords(facts);
    const where = [facts.placeText, c ? `(${hi ? 'लगभग' : 'approx.'} ${c})` : null]
      .filter(Boolean)
      .join(' ');
    if (where) lines.push(hi ? `स्थान: ${where}` : `Location: ${where}`);
    if (facts.nearby?.length) {
      lines.push(hi ? `आस-पास: ${facts.nearby.join(', ')}` : `Nearby: ${facts.nearby.join(', ')}`);
    }
  }
  lines.push(
    hi
      ? 'JunkSnap प्लेटफ़ॉर्म पर धुंधली की गई फ़ोटो (चेहरे और नंबर प्लेट छिपे हुए) GPS और समय के साथ उपलब्ध हैं।'
      : 'Blurred photographs (faces and number plates hidden) with GPS and time stamps are available on the JunkSnap platform.',
  );
  return lines;
}

function addresseeLine(a, lang) {
  if (a.office === 'localBody') return [a.title, a.orgName].filter(Boolean).join(', ');
  const label = OFFICE_LABEL[lang][a.office] ?? a.title;
  return a.name ? `${label}, ${a.name}` : label;
}

// Poora letter ek plain text me (print / PDF / copy sab isi se)
export function assembleLetter({
  lang,
  date = new Date(),
  addressees,
  subject,
  opening,
  statusLine,
  evidenceLines,
  clauses,
  request,
}) {
  const hi = lang === 'hi';
  const to = addressees.filter((a) => a.role === 'to');
  const cc = addressees.filter((a) => a.role !== 'to');
  const out = [];

  out.push(fmtDate(date, lang), '');
  out.push(hi ? 'सेवा में,' : 'To,');
  if (to.length) to.forEach((a) => out.push(addresseeLine(a, lang)));
  else out.push(hi ? 'संबंधित अधिकारी' : 'The Concerned Authority');
  if (cc.length) {
    out.push('', hi ? 'प्रतिलिपि:' : 'Copy to:');
    cc.forEach((a) => out.push(`- ${addresseeLine(a, lang)}`));
  }

  out.push('', `${hi ? 'विषय' : 'Subject'}: ${subject}`, '');
  out.push(hi ? 'माननीय महोदय/महोदया,' : 'Respected Sir/Madam,', '');
  out.push(opening, '');
  out.push(statusLine);
  evidenceLines.forEach((l) => out.push(`- ${l}`));

  if (clauses.length) {
    out.push(
      '',
      hi
        ? 'इस विषय पर निम्नलिखित प्रावधान लागू होते हैं (मूल पाठ):'
        : 'The following provision(s) of the applicable rules are relevant:',
    );
    clauses.forEach((c) => {
      out.push(`"${c.text}"`);
      out.push(`— ${c.ruleName} (${c.version}), ${hi ? 'खंड' : 'clause'} ${c.clauseId}`);
    });
  }

  out.push('', request, '');
  out.push(hi ? 'भवदीय,' : 'Yours faithfully,');
  out.push(hi ? '[आपका नाम]' : '[Your name]');
  out.push(hi ? '[आपका पता / संपर्क]' : '[Your address / contact]');
  return out.join('\n');
}