import { createReport as create } from '../services/reportService.js';

export async function createReport(req, res) {
  const report = await create(req.user, req.body);
  // 202 = mil gayi, background me process hogi
  res.status(202).json({
    success: true,
    data: { report: { id: report._id, status: report.status } },
  });
}
