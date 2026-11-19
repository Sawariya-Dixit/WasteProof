import { findInBbox, getSiteDetail } from '../services/siteService.js';
import { castVote } from '../services/voteService.js';
import { claimCleanup } from '../services/cleanupService.js';
import { flagPhoto } from '../services/photoFlagService.js';
import { addSitePhoto, listSitePhotos } from '../services/SitePhotoService.js';
export async function listSites(req, res) {
  const sites = await findInBbox(req.valid.query);
  res.json({ success: true, data: { sites }, meta: { count: sites.length } });
}

export async function getSite(req, res) {
  const site = await getSiteDetail(req.valid.params.id, req.user?._id);
  res.json({ success: true, data: { site } });
}

export async function postVote(req, res) {
  const data = await castVote(req.user, req.valid.params.id, req.body);
  res.status(201).json({ success: true, data });
}

export async function postMeToo(req, res) {
  const data = await castVote(req.user, req.valid.params.id, { ...req.body, value: 'me_too' });
  res.status(201).json({ success: true, data });
}
export async function postCleanup(req, res) {
  const data = await claimCleanup(req.user, req.valid.params.id, req.body);
  res.status(201).json({ success: true, data });
}

export async function postReportPhoto(req, res) {
  const data = await flagPhoto(req.user, req.valid.params.id, req.body);
  res.status(201).json({ success: true, data });
}

// 'Add photo': report ki tarah 202 (pipeline background me chalegi)
export async function postSitePhoto(req, res) {
  const report = await addSitePhoto(req.user, req.valid.params.id, req.body, req.deviceId);
  res.status(202).json({
    success: true,
    data: { report: { id: report._id, status: report.status } },
  });
}

export async function getSitePhotos(req, res) {
  const photos = await listSitePhotos(req.valid.params.id);
  res.json({ success: true, data: { photos }, meta: { count: photos.length } });
}