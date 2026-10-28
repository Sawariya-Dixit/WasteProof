import { findInBbox } from '../services/siteService.js';

export async function listSites(req, res) {
  const sites = await findInBbox(req.valid.query);
  res.json({ success: true, data: { sites }, meta: { count: sites.length } });
}