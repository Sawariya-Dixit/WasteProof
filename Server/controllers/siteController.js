import { findInBbox, getSiteDetail } from '../services/siteService.js';

export async function listSites(req, res) {
  const sites = await findInBbox(req.valid.query);
  res.json({ success: true, data: { sites }, meta: { count: sites.length } });
}

export async function getSite(req, res) {
  const site = await getSiteDetail(req.valid.params.id);
  res.json({ success: true, data: { site } });
}
