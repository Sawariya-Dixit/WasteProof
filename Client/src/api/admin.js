import { api } from './client';

const d = (r) => r.data.data;

export const fetchReviewReports = (params) => api.get('/admin/reports', { params }).then((r) => ({ ...d(r), meta: r.data.meta }));
export const actOnReport = (id, body) => api.patch(`/admin/reports/${id}`, body).then(d);
export const fetchQueueStats = () => api.get('/admin/queue/stats').then(d);
export const searchAreas = (params) => api.get('/admin/areas', { params }).then((r) => d(r).areas);
export const importAreas = (body) => api.post('/admin/areas/import', body, { timeout: 120000 }).then(d);
export const fetchReps = (params) => api.get('/admin/representatives', { params }).then((r) => ({ ...d(r), meta: r.data.meta }));
export const createRep = (body) => api.post('/admin/representatives', body).then(d);
export const deleteRep = (id) => api.delete(`/admin/representatives/${id}`).then(d);
export const importRepsCsv = (body) => api.post('/admin/representatives/import', body).then(d);