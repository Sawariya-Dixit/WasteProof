import { useQuery } from '@tanstack/react-query';
import { fetchAreaRanking, fetchAreasMap, fetchAreaDetail } from '@/api/areas';

export const useAreaRanking = (level) =>
  useQuery({
    queryKey: ['areas', 'ranking', level],
    queryFn: () => fetchAreaRanking({ level }),
    staleTime: 60_000,
  });

export const useAreasMap = (level) =>
  useQuery({
    queryKey: ['areas', 'map', level],
    queryFn: () => fetchAreasMap({ level }),
    staleTime: 60_000,
  });

export const useAreaDetail = (id) =>
  useQuery({
    queryKey: ['areas', 'detail', id],
    queryFn: () => fetchAreaDetail(id),
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: (count, err) => err?.status !== 404 && count < 2,
  });