import { findInBbox, getSiteDetail } from '../services/siteService.js';
import { castVote } from '../services/voteService.js';

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