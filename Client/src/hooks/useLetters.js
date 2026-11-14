import { useMutation, useQuery } from '@tanstack/react-query';
import { createLetter, fetchLetter, fetchLetterPdf } from '@/api/letters';

// Letter ban jaane ke baad badalta nahi, isliye hamesha fresh maano
export const useLetter = (id) =>
  useQuery({
    queryKey: ['letters', id],
    queryFn: () => fetchLetter(id),
    enabled: Boolean(id),
    staleTime: Infinity,
    retry: (count, err) => err?.status !== 404 && count < 2,
  });

export const useCreateLetter = () => useMutation({ mutationFn: createLetter });

// PDF pehle se taiyaar rakhte hain (letter khulte hi), taaki Download / Share par wait na ho.
// Share ke liye ye zaroori hai: phone tap ke turant baad hi share sheet kholne deta hai.
export const useLetterPdf = (id, enabled = true) =>
  useQuery({
    queryKey: ['letters', id, 'pdf'],
    queryFn: () => fetchLetterPdf(id),
    enabled: Boolean(id) && enabled,
    staleTime: Infinity,
    retry: 1,
  });