import { useQuery } from '@tanstack/react-query';
import { fetchSite } from '@/api/sites';

export const siteKey = (id) => ['site', id];

export function useSite(id) {
  return useQuery({
    queryKey: siteKey(id),
    queryFn: () => fetchSite(id),
    enabled: Boolean(id),
    staleTime: 15_000,
    retry: (count, err) => err?.status !== 404 && count < 2,
  });
}