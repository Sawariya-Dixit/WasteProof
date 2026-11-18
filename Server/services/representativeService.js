import { Area } from '../models/Area.js';
import { Representative } from '../models/Representative.js';
import { AdminLog } from '../models/AdminLog.js';
import { AppError } from '../utils/AppError.js';
import { REP_LEVELS, REP_OFFICES } from '../config/defaults.js';
import { csvToObjects } from '../utils/csv.js';

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const shape = (r) => ({
  id: r._id,
  office: r.office,
  name: r.name,
  contactNote: r.contactNote ?? null,
  area: r.areaId && r.areaId.name ? { id: r.areaId._id, name: r.areaId.name, level: r.areaId.level } : null,
});

export async function listReps({ areaId, office, page, limit }) {
  const filter = {};
  if (areaId) filter.areaId = areaId;
  if (office) filter.office = office;
  const [rows, total] = await Promise.all([
    Representative.find(filter)
      .sort({ office: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('areaId', 'name level')
      .lean(),
    Representative.countDocuments(filter),
  ]);
  return { reps: rows.map(shape), total };
}

function checkLevel(office, area) {
  if (!REP_LEVELS[office]?.includes(area.level)) {
    throw new AppError(
      `${office} ka area level ${REP_LEVELS[office].join('/')} hona chahiye (mila: ${area.level})`,
      422,
      'OFFICE_LEVEL_MISMATCH',
    );
  }
}

export async function createRep(adminId, { office, areaId, name, contactNote }) {
  const area = await Area.findById(areaId).select('level name').lean();
  if (!area) throw new AppError('Area nahi mili', 404, 'AREA_NOT_FOUND');
  checkLevel(office, area);
  if (await Representative.exists({ areaId, office })) {
    throw new AppError('Is area me ye office pehle se hai. Naam badalna ho to edit karo.', 409, 'REP_EXISTS');
  }
  const rep = await Representative.create({ office, areaId, name, contactNote });
  await AdminLog.create({ adminId, action: 'rep.create', targetType: 'representative', targetId: String(rep._id) });
  return { id: rep._id };
}

export async function updateRep(adminId, id, patch) {
  const rep = await Representative.findByIdAndUpdate(id, { $set: patch }, { returnDocument: 'after' });
  if (!rep) throw new AppError('Representative nahi mila', 404, 'NOT_FOUND');
  await AdminLog.create({ adminId, action: 'rep.update', targetType: 'representative', targetId: String(id) });
  return { id: rep._id };
}

export async function deleteRep(adminId, id) {
  const rep = await Representative.findByIdAndDelete(id);
  if (!rep) throw new AppError('Representative nahi mila', 404, 'NOT_FOUND');
  await AdminLog.create({ adminId, action: 'rep.delete', targetType: 'representative', targetId: String(id) });
  return { id };
}

// CSV columns: office,areaLevel,areaName,name,contactNote (data/representatives.csv jaisa). Party column nahi.
export async function importRepsCsv(adminId, { csv, dryRun }) {
  const rows = csvToObjects(csv);
  const saved = [];
  const skipped = [];

  for (const r of rows) {
    const skip = (reason) => skipped.push({ line: r._line, reason });
    if (!r.name || r.name === 'FILL_ME') {
      skip('naam nahi bhara');
      continue;
    }
    if (!REP_OFFICES.includes(r.office)) {
      skip(`office galat: "${r.office}"`);
      continue;
    }
    if (!REP_LEVELS[r.office].includes(r.areaLevel)) {
      skip(`${r.office} ke saath areaLevel "${r.areaLevel}" nahi chalta`);
      continue;
    }
    const area = await Area.findOne({ level: r.areaLevel, name: new RegExp(`^${esc(r.areaName)}$`, 'i') })
      .select('_id')
      .lean();
    if (!area) {
      skip(`area DB me nahi mili: ${r.areaLevel} "${r.areaName}"`);
      continue;
    }
    if (!dryRun) {
      await Representative.updateOne(
        { areaId: area._id, office: r.office },
        { $set: { name: r.name, contactNote: r.contactNote || undefined } },
        { upsert: true },
      );
    }
    saved.push({ line: r._line, office: r.office, area: r.areaName, name: r.name });
  }

  if (!dryRun && saved.length) {
    await AdminLog.create({ adminId, action: 'rep.import', targetType: 'representative', meta: { saved: saved.length } });
  }
  return { dryRun: !!dryRun, rows: rows.length, saved: saved.length, preview: saved.slice(0, 10), skipped: skipped.slice(0, 30) };
}