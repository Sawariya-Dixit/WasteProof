import {
  createReport as create,
  listMyReports,
  getMyReport,
  confirmMyReport,
} from '../services/reportService.js';

export async function createReport(req, res) {
  const report = await create(req.user, req.body);
  // 202 = mil gayi, background me process hogi
  res.status(202).json({
    success: true,
    data: { report: { id: report._id, status: report.status } },
  });
}

export async function listMine(req, res) {
  const { page, limit } = req.valid.query;
  const { reports, total } = await listMyReports(req.user._id, { page, limit });
  res.json({ success: true, data: { reports }, meta: { page, limit, total } });
}

export async function getOne(req, res) {
  const report = await getMyReport(req.user._id, req.valid.params.id);
  res.json({ success: true, data: { report } });
}

export async function confirmReport(req, res) {
  const report = await confirmMyReport(req.user._id, req.valid.params.id, req.body.confirmed);
  res.json({ success: true, data: { report } });
}
