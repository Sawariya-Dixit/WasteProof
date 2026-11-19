import { Site } from '../models/Site.js';
import { Area } from '../models/Area.js';
import { LocalBody } from '../models/LocalBody.js';
import { Representative } from '../models/Representative.js';
import { RuleText } from '../models/RuleText.js';
import { Letter } from '../models/Letter.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import {
  VERIFY_THRESHOLD,
  AREA_MIN_VERIFIED,
  PUBLIC_SITE_STATUSES,
  LETTER_DEDUPE_MINUTES,
  SCORES,
} from '../config/defaults.js';
import {
  CLAUSES_BY_ISSUE,
  OFFICES_BY_ISSUE,
  OFFICES_BY_SCOPE,
  OFFICE_LEVEL,
} from '../config/letterRules.js';
import { writeLetterProse } from '../ai/letterWriter.js';
import { verifyLetterProse, numbersIn } from '../ai/quoteVerifier.js';
import {
  templateParts,
  buildSubject,
  buildStatusLine,
  buildEvidenceLines,
  assembleLetter,
} from './letterTemplates.js';

const PLACEHOLDER_NAME = /^FILL_ME$/i; // seed CSV me jab tak asli naam nahi bhara

// ======================= Day 16: kisko likhna hai, kaun si rule clauses =======================

// Pure function: kin offices ko likhna hai, kis order me.
export function selectOffices({ issueType, scope = 'site' }) {
  const list = scope === 'site' ? OFFICES_BY_ISSUE[issueType] : OFFICES_BY_SCOPE[scope];
  if (!list) throw new AppError('Issue type ya scope galat hai', 422, 'VALIDATION_ERROR');
  return list.map((office, i) => ({ office, role: i === 0 ? 'to' : 'cc' }));
}

// Site ya area se un areas ke ids nikalo: { ward, assembly, loksabha, district }
async function resolveAreaIds({ siteId, areaId }) {
  if (siteId) {
    const site = await Site.findById(siteId).select('areaIds localBodyId').lean();
    if (!site) throw new AppError('Site nahi mili', 404, 'NOT_FOUND');
    return { areaIds: site.areaIds ?? {}, localBodyId: site.localBodyId ?? null };
  }
  const area = await Area.findById(areaId).select('level parentIds').lean();
  if (!area) throw new AppError('Area nahi mili', 404, 'NOT_FOUND');
  const parents = area.parentIds?.length
    ? await Area.find({ _id: { $in: area.parentIds } }).select('level').lean()
    : [];
  const areaIds = { [area.level]: area._id };
  for (const p of parents) areaIds[p.level] ??= p._id;

  // Parent ids seed me na hon to us area ki kisi ek site se baaki levels bhar lo
  let localBodyId = null;
  if (Object.values(OFFICE_LEVEL).some((lvl) => !areaIds[lvl])) {
    const s = await Site.findOne({ [`areaIds.${area.level}`]: area._id })
      .select('areaIds localBodyId')
      .lean();
    for (const [lvl, id] of Object.entries(s?.areaIds ?? {})) if (id) areaIds[lvl] ??= id;
    localBodyId = s?.localBodyId ?? null;
  }
  return { areaIds, localBodyId };
}

// Letter kisko jayega. Party kahin nahi. Naam seed nahi hua ho to name = null (letter me sirf pad).
export async function pickAddressees({ siteId, areaId, issueType, scope = 'site' }) {
  const { areaIds, localBodyId } = await resolveAreaIds({ siteId, areaId });
  const wanted = selectOffices({ issueType, scope });

  let localBody = null;
  if (wanted.some((w) => w.office === 'localBody')) {
    localBody = localBodyId
      ? await LocalBody.findById(localBodyId).lean()
      : areaIds.assembly
        ? await LocalBody.findOne({ areaIds: areaIds.assembly }).lean()
        : null;
  }

  const repAreaIds = Object.values(OFFICE_LEVEL)
    .map((lvl) => areaIds[lvl])
    .filter(Boolean);
  const reps = repAreaIds.length
    ? await Representative.find({ areaId: { $in: repAreaIds } })
        .select('office name areaId')
        .lean()
    : [];

  const out = [];
  for (const { office, role } of wanted) {
    if (office === 'localBody') {
      if (localBody) {
        out.push({ role, office, title: localBody.headTitle, orgName: localBody.name, name: null });
      }
      continue;
    }
    const areaOfOffice = areaIds[OFFICE_LEVEL[office]];
    const rep = areaOfOffice
      ? reps.find((r) => r.office === office && String(r.areaId) === String(areaOfOffice))
      : null;
    if (!rep) continue; // data nahi hai to skip, jhoota naam nahi
    out.push({
      role,
      office,
      title: office,
      orgName: null,
      name: PLACEHOLDER_NAME.test(rep.name) ? null : rep.name,
    });
  }

  // 'to' hamesha pehla bache
  if (out.length && !out.some((o) => o.role === 'to')) out[0].role = 'to';
  return out;
}

// Issue ke liye rule clauses. Text hamesha DB (RuleText) se, LLM se kabhi nahi.
export async function pickClauses(issueType) {
  const ids = CLAUSES_BY_ISSUE[issueType];
  if (!ids) throw new AppError('Issue type galat hai', 422, 'VALIDATION_ERROR');
  if (!ids.length) return { clauses: [], missing: [] };

  const rules = await RuleText.find({ 'clauses.id': { $in: ids } })
    .select('name version sha256 clauses')
    .sort({ version: -1 })
    .lean();

  const clauses = [];
  const seen = new Set();
  for (const rule of rules) {
    for (const c of rule.clauses) {
      if (!ids.includes(c.id) || seen.has(c.id)) continue;
      seen.add(c.id);
      clauses.push({
        ruleName: rule.name,
        version: rule.version,
        sha256: rule.sha256,
        clauseId: c.id,
        text: c.text,
      });
    }
  }
  return { clauses, missing: ids.filter((id) => !seen.has(id)) };
}

// ======================= Day 17: letter banana =======================

// Areas ke naam level ke hisaab se: { ward, assembly, district }
async function areaNamesOf(areaIds) {
  const ids = Object.values(areaIds ?? {}).filter(Boolean);
  if (!ids.length) return {};
  const areas = await Area.find({ _id: { $in: ids } }).select('name level').lean();
  const names = {};
  for (const a of areas) names[a.level] = a.name;
  return names;
}

const placeTextOf = (names) =>
  [...new Set([names.ward, names.assembly, names.district].filter(Boolean))].join(', ');

// ---- Site letter ----
async function loadSiteContext(siteId) {
  const site = await Site.findById(siteId)
    .select('type status backerCount reportCount photoUrls location areaIds nearby createdAt updatedAt')
    .lean();
  if (!site || site.status === 'hidden') throw new AppError('Site nahi mili', 404, 'NOT_FOUND');
  if (site.status === 'cleaned') {
    throw new AppError('Ye site saaf ho chuki hai, letter nahi banega', 409, 'SITE_CLEANED');
  }

  const names = await areaNamesOf(site.areaIds);
  const [lng, lat] = site.location.coordinates;
  const siteVerified = site.status === 'verified';
  const facts = {
    scope: 'site',
    placeText: placeTextOf(names),
    lat,
    lng,
    reports: site.reportCount ?? 1,
    backers: site.backerCount ?? 0,
    firstDate: site.createdAt,
    lastDate: site.updatedAt,
    nearby: [...(site.nearby?.schools ?? []), ...(site.nearby?.hospitals ?? [])].slice(0, 3),
  };
  return {
    issueType: site.type, // site letter ka issue hamesha site ka apna type
    siteVerified,
    facts,
    evidence: {
      counts: {
        reports: facts.reports,
        backers: facts.backers,
        verified: siteVerified ? 1 : 0,
        total: 1,
      },
      dates: { first: facts.firstDate, last: facts.lastDate },
      photos: (site.photoUrls ?? []).slice(0, 3), // sirf blurred public copies
      location: { lat, lng, text: facts.placeText },
    },
  };
}

// ---- Area letter (ward / assembly / loksabha / district) ----
async function loadAreaContext({ areaId, scope, issueType }) {
  const area = await Area.findById(areaId).select('name level').lean();
  if (!area) throw new AppError('Area nahi mili', 404, 'NOT_FOUND');
  if (area.level !== scope) {
    throw new AppError('Scope is area ke level se match nahi karta', 422, 'SCOPE_MISMATCH');
  }

  const base = { [`areaIds.${area.level}`]: area._id, type: issueType };
  if (!SCORES.includeTest) base.isTest = { $ne: true };
  const verifiedFilter = { ...base, status: 'verified' };

  const [verified, total, first, last, top] = await Promise.all([
    Site.countDocuments(verifiedFilter),
    Site.countDocuments({ ...base, status: { $in: PUBLIC_SITE_STATUSES } }),
    Site.findOne(verifiedFilter).sort({ createdAt: 1 }).select('createdAt').lean(),
    Site.findOne(verifiedFilter).sort({ createdAt: -1 }).select('createdAt').lean(),
    Site.find(verifiedFilter).sort({ backerCount: -1 }).limit(3).select('photoUrls').lean(),
  ]);

  // Area letter ke liye us issue ki kam se kam AREA_MIN_VERIFIED verified sites chahiye
  if (verified < AREA_MIN_VERIFIED) {
    throw new AppError(
      `Is issue ki kam se kam ${AREA_MIN_VERIFIED} verified sites chahiye`,
      422,
      'NOT_ENOUGH_EVIDENCE',
      { verified, needed: AREA_MIN_VERIFIED - verified },
    );
  }

  const facts = {
    scope: area.level,
    areaName: area.name,
    placeText: area.name,
    verifiedSites: verified,
    totalSites: total,
    firstDate: first?.createdAt ?? null,
    lastDate: last?.createdAt ?? null,
  };
  return {
    issueType,
    siteVerified: true, // AREA_MIN_VERIFIED+ verified sites hain
    facts,
    evidence: {
      counts: { verified, total },
      dates: { first: facts.firstDate, last: facts.lastDate },
      photos: top.map((s) => s.photoUrls?.[0]).filter(Boolean),
      location: { text: area.name },
    },
  };
}

// LLM ke text me sirf wahi numbers allowed jo facts / jagah ke naam / clause ids me hain
function allowedNumbersFor(facts, clauses) {
  const allowed = new Set([VERIFY_THRESHOLD, AREA_MIN_VERIFIED]);
  for (const v of [facts.reports, facts.backers, facts.verifiedSites, facts.totalSites]) {
    if (Number.isFinite(v)) allowed.add(v);
  }
  const texts = [facts.placeText, facts.areaName, ...clauses.flatMap((c) => [c.clauseId, c.version])];
  for (const t of texts) for (const n of numbersIn(t)) allowed.add(n);
  return allowed;
}

function shapeLetter(doc) {
  const d = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: String(d._id),
    scope: d.scope,
    siteId: d.siteId ? String(d.siteId) : null,
    areaId: d.areaId ? String(d.areaId) : null,
    issueType: d.issueType,
    lang: d.lang,
    subject: d.subject,
    body: d.body,
    addressees: d.addressees ?? [],
    clauses: (d.clauses ?? []).map((c) => ({
      ruleName: c.ruleName,
      version: c.version,
      clauseId: c.clauseId,
      text: c.text,
    })),
    evidence: d.evidence ?? {},
    usedTemplate: d.usedTemplate,
    createdAt: d.createdAt,
  };
}

// POST /letters. input = { scope, siteId?, areaId?, issueType?, lang }
export async function createLetter(user, input) {
  const { scope, lang } = input;

  // Wahi letter 10 min ke andar dobara maango to wahi do (LLM cost aur spam se bachne ke liye)
  const recent = await Letter.findOne({
    userId: user._id,
    scope,
    lang,
    ...(scope === 'site' ? { siteId: input.siteId } : { areaId: input.areaId, issueType: input.issueType }),
    createdAt: { $gte: new Date(Date.now() - LETTER_DEDUPE_MINUTES * 60_000) },
  }).sort({ createdAt: -1 });
  if (recent) return shapeLetter(recent);

  const ctx =
    scope === 'site'
      ? await loadSiteContext(input.siteId)
      : await loadAreaContext({ areaId: input.areaId, scope, issueType: input.issueType });
  const { issueType, siteVerified, facts } = ctx;

  const addressees = await pickAddressees({
    siteId: scope === 'site' ? input.siteId : undefined,
    areaId: scope === 'site' ? undefined : input.areaId,
    issueType,
    scope,
  });
  const { clauses } = await pickClauses(issueType);

  // LLM likhe, verifier jaanche. Kuch bhi galat to template.
  let parts = templateParts({ lang, issueType, facts });
  let usedTemplate = true;
  let templateReason = null;

  if (env.LETTER_LLM !== 'on') {
    templateReason = 'llm_off';
  } else {
    try {
      const llm = await writeLetterProse({ lang, issueType, facts, clauses });
      const check = verifyLetterProse(llm, {
        clauses,
        siteVerified,
        allowedNumbers: allowedNumbersFor(facts, clauses),
      });
      if (check.ok) {
        parts = llm;
        usedTemplate = false;
      } else {
        templateReason = check.reason;
        logger.info({ reason: check.reason }, 'letter: LLM text check fail, template use hua');
      }
    } catch (err) {
      templateReason = 'llm_unavailable';
      logger.warn({ err: err.message }, 'letter: LLM nahi chala, template use hua');
    }
  }

  const subject = buildSubject({ lang, issueType, facts });
  const body = assembleLetter({
    lang,
    addressees,
    subject,
    opening: parts.opening,
    statusLine: buildStatusLine({ lang, facts, siteVerified }), // imaandari wali line server likhta hai
    evidenceLines: buildEvidenceLines({ lang, facts }),
    clauses, // rule text hamesha DB se, LLM se kabhi nahi
    request: parts.request,
  });

  const doc = await Letter.create({
    userId: user._id,
    scope,
    siteId: scope === 'site' ? input.siteId : undefined,
    areaId: scope === 'site' ? undefined : input.areaId,
    issueType,
    lang,
    subject,
    body,
    addressees,
    clauses,
    evidence: ctx.evidence,
    usedTemplate,
    templateReason,
  });
  return shapeLetter(doc);
}

// GET /letters/:id (sirf apna letter; doosre ka ho to 404, pata hi na chale)
export async function getLetter(user, id) {
  const doc = await Letter.findOne({ _id: id, userId: user._id });
  if (!doc) throw new AppError('Letter nahi mila', 404, 'NOT_FOUND');
  return shapeLetter(doc);
}

// GET /rules (public): kaun se rule texts aur versions cite hote hain
export async function listRules() {
  const rules = await RuleText.find()
    .select('name source version sha256 clauses')
    .sort({ name: 1, version: -1 })
    .lean();
  return rules.map((r) => ({
    name: r.name,
    source: r.source,
    version: r.version,
    sha256: r.sha256,
    clauses: r.clauses,
  }));
}