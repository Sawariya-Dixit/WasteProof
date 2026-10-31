import { api } from './client';

// Pehli baar bulane par backend user ko DB me bana deta hai
export const fetchMe = () => api.get('/users/me').then((r) => r.data.data.user);
export const updateMe = (patch) => api.patch('/users/me', patch).then((r) => r.data.data.user);
