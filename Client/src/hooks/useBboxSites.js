import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchSites } from '@/api/sites';
import { EMPTY_SITES, bboxTooLarge, roundBbox } from '@/lib/geo';

// bbox badalne par us box ki sites laata hai. Pichla data naya aane tak dikhta rehta hai (flicker nahi).
export function useBboxSites(bbox, filters = {}) {
  const key = bbox ? roundBbox(bbox) : null;
  const tooBig = key ? bboxTooLarge(key) : false;
  const enabled = Boolean(key) && !tooBig;

  const query = useQuery({
    queryKey: ['sites', key, filters],
    queryFn: () => fetchSites({ bbox: key, ...filters }),
    enabled,
    placeholderData: keepPreviousData,
  });

  return {
    sites: enabled ? (query.data ?? EMPTY_SITES) : EMPTY_SITES,
    tooBig,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}