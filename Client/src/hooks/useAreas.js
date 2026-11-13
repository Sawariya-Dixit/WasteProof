import { useQuery } from '@tanstack/react-query';
import { fetchAreaRanking, fetchAreasMap } from '@/api/areas';

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