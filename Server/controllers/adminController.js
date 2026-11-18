import { listReviewReports, getReviewReport, reviewReport, queueStats } from '../services/adminService.js';
import { importAreas, searchAreas } from '../services/areaImportService.js';
import { listReps, createRep, updateRep, deleteRep, importRepsCsv } from '../services/representativeService.js';

const ok = (res, data, meta, status = 200) => res.status(status).json({ success: true, data, meta });

export async function reviewList(req, res) {
  const { reports, total } = await listReviewReports(req.valid.query);
  const { page, limit } = req.valid.query;
  ok(res, { reports }, { page, limit, total });
}
export async function reviewOne(req, res) {
  ok(res, { report: await getReviewReport(req.valid.params.id) });
}
export async function reviewAction(req, res) {
  ok(res, await reviewReport(req.user._id, req.valid.params.id, req.body));
}
export async function stats(req, res) {
  res.set('Cache-Control', 'no-store');
  ok(res, await queueStats());
}

export async function areasList(req, res) {
  ok(res, { areas: await searchAreas(req.valid.query) });
}
export async function areasImport(req, res) {
  ok(res, await importAreas(req.user._id, req.body));
}

export async function repsList(req, res) {
  const { reps, total } = await listReps(req.valid.query);
  const { page, limit } = req.valid.query;
  ok(res, { reps }, { page, limit, total });
}
export async function repsCreate(req, res) {
  ok(res, await createRep(req.user._id, req.body), undefined, 201);
}
export async function repsUpdate(req, res) {
  ok(res, await updateRep(req.user._id, req.valid.params.id, req.body));
}
export async function repsDelete(req, res) {
  ok(res, await deleteRep(req.user._id, req.valid.params.id));
}
export async function repsImport(req, res) {
  ok(res, await importRepsCsv(req.user._id, req.body));
}