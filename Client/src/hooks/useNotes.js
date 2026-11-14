import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addNote, deleteNote, fetchNotes } from '@/api/notes';

export const useNotes = (siteId, limit) =>
  useQuery({
    queryKey: ['notes', siteId, limit],
    queryFn: () => fetchNotes(siteId, { limit }),
    enabled: Boolean(siteId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

// Note turant list me aata hai. AI summary server par kuch second baad banti hai, isliye thodi der baad ek baar aur refresh.
function useRefreshNotes(siteId) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['notes', siteId] });
    setTimeout(() => qc.invalidateQueries({ queryKey: ['notes', siteId] }), 45_000);
  };
}

export function useAddNote(siteId) {
  const refresh = useRefreshNotes(siteId);
  return useMutation({ mutationFn: (text) => addNote(siteId, text), onSuccess: refresh });
}

export function useDeleteNote(siteId) {
  const refresh = useRefreshNotes(siteId);
  return useMutation({ mutationFn: (noteId) => deleteNote(siteId, noteId), onSuccess: refresh });
}