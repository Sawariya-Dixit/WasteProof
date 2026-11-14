import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNobinZones, reportNobin } from '@/api/nobin';
import { EMPTY_ZONES } from '@/lib/nobinGeo';
import { bboxTooLarge, roundBbox } from '@/lib/geo';

// bbox badalne par us box ke no-bin zones laata hai (useBboxSites jaisa)
export function useNobinZones(bbox) {
  const key = bbox ? roundBbox(bbox) : null;
  const enabled = Boolean(key) && !bboxTooLarge(key);

  const query = useQuery({
    queryKey: ['nobin', key],
    queryFn: () => fetchNobinZones({ bbox: key }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  return { zones: enabled ? (query.data ?? EMPTY_ZONES) : EMPTY_ZONES };
}

export function useReportNobin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reportNobin,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nobin'] }), // map par circle turant dikhe
  });
}