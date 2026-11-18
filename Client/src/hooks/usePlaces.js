import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchPlaces } from '@/api/places';
import { bboxTooLarge, roundBbox } from '@/lib/geo';

// Places pill ke liye: sirf panel khula ho tabhi server ko poochho
export function usePlaces(bbox, { enabled = true } = {}) {
  const key = bbox ? roundBbox(bbox) : null;
  const ok = enabled && Boolean(key) && !bboxTooLarge(key);
  const query = useQuery({
    queryKey: ['places', key],
    queryFn: () => fetchPlaces({ bbox: key }),
    enabled: ok,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  return {
    places: ok ? (query.data ?? []) : [],
    isLoading: ok && query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}