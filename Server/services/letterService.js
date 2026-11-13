import { Site } from '../models/Site.js';
import { Area } from '../models/Area.js';
import { LocalBody } from '../models/LocalBody.js';
import { Representative } from '../models/Representative.js';
import { RuleText } from '../models/RuleText.js';
import { AppError } from '../utils/AppError.js';
import {
  CLAUSES_BY_ISSUE,
  OFFICES_BY_ISSUE,
  OFFICES_BY_SCOPE,
  OFFICE_LEVEL,
} from '../config/letterRules.js';

const PLACEHOLDER_NAME = /^FILL_ME$/i; // seed CSV me jab tak asli naam nahi bhara

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
  return { areaIds, localBodyId: null };
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