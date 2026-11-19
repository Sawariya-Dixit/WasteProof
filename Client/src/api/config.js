import { api } from './client';

// Public. Return: { verifyThreshold, areaMinVerified }
export async function fetchConfig(timeout = 4000) {
  const res = await api.get('/config', { timeout });
  return res.data.data;
}