import { useQuery } from '@tanstack/react-query';
import { fetchMyReports, fetchReport } from '@/api/reports';

const POLL_MS = 4000;
const GIVE_UP_MS = 15 * 60 * 1000; // 15 min se purani atki report ke liye polling band
export const myReportsKey = ['reports', 'mine'];

// Worker abhi is report par kaam kar raha hai?
export const isRunning = (r) =>
  r.status === 'pending' &&
  r.progress.done < r.progress.total &&
  Date.now() - new Date(r.createdAt).getTime() < GIVE_UP_MS;

// Koi report chal rahi ho to har 4 sec me dobara laao, warna ruk jao
export function useMyReports() {
  return useQuery({
    queryKey: myReportsKey,
    queryFn: () => fetchMyReports(),
    staleTime: 0,
    refetchOnMount: 'always', // Activity page kholte hi taaza list
    refetchInterval: (query) => (query.state.data?.some(isRunning) ? POLL_MS : false),
  });
}

export function useReportDetail(id, { enabled, running }) {
  return useQuery({
    queryKey: ['reports', 'one', id],
    queryFn: () => fetchReport(id),
    enabled,
    staleTime: 0,
    refetchInterval: running ? POLL_MS : false,
  });
}