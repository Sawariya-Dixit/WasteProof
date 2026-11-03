import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queueAll, queueCount, queuePut, queueRemove } from '@/lib/offlineQueue';
import { createReport, signUpload, uploadToCloudinary } from '@/api/reports';
import { myReportsKey } from '@/hooks/useMyReports';
import { QUEUE_MAX_AGE_MS } from '@/lib/snapConfig';
import { useQueueStore } from '@/store/queueStore';

const MAX_TRIES = 5;
const RETRY_EVERY_MS = 30_000;
let flushing = false; // ek time par ek hi flush

export async function refreshQueueCount() {
  try {
    useQueueStore.getState().setCount(await queueCount());
  } catch {
    /* IndexedDB band ho sakta hai (private mode) */
  }
}

// Network ya server ki dikkat = baad me dobara. Baaki (4xx) = ye report kabhi nahi chalegi, hata do
const isRetriable = (err) =>
  err.code === 'NETWORK_ERROR' ||
  err.code === 'RATE_LIMIT' ||
  err.code === 'UPLOAD_FAILED' ||
  (err.status ?? 0) >= 500;

async function sendOne(item) {
  let key = item.key;
  if (!key) {
    const sign = await signUpload();
    await uploadToCloudinary(sign, item.blob);
    key = sign.public_id;
    await queuePut({ ...item, key }); // upload ho gaya, dobara upload nahi karenge
  }
  await createReport({
    key,
    sha256: item.sha256,
    lat: item.gps.lat,
    lng: item.gps.lng,
    accuracyM: item.gps.accuracyM,
    capturedAt: new Date(item.capturedAt).toISOString(),
    type: item.type,
    ...(item.note ? { note: item.note } : {}),
  });
}

export async function flushQueue(owner, onSent) {
  if (flushing || !owner || !navigator.onLine) return;
  flushing = true;
  const { addDropped } = useQueueStore.getState();
  try {
    const items = (await queueAll()).filter((i) => i.owner === owner);
    for (const item of items) {
      // Server 10 min se purani photo reject karta hai, bhejne ka fayda nahi
      if (Date.now() - item.capturedAt > QUEUE_MAX_AGE_MS) {
        await queueRemove(item.id);
        addDropped(1);
        continue;
      }
      try {
        await sendOne(item);
        await queueRemove(item.id);
        onSent?.();
      } catch (err) {
        if (err.code === 'DUPLICATE_IMAGE') {
          await queueRemove(item.id); // pehle hi ja chuki thi
        } else if (isRetriable(err) && (item.tries ?? 0) + 1 < MAX_TRIES) {
          await queuePut({ ...item, tries: (item.tries ?? 0) + 1 });
          break; // net ya server theek nahi, baaki baad me
        } else {
          await queueRemove(item.id);
          addDropped(1);
        }
      }
    }
  } finally {
    flushing = false;
    await refreshQueueCount();
  }
}

// AppShell me ek baar lagao: online aate hi, aur har 30 sec me queue bhejta hai
export function useOnlineQueue() {
  const { user, isAuthed } = useAuth();
  const qc = useQueryClient();
  const owner = user?.id ?? user?._id ?? null;

  useEffect(() => {
    if (!isAuthed || !owner) return undefined;
    const run = () => flushQueue(owner, () => qc.invalidateQueries({ queryKey: myReportsKey }));
    refreshQueueCount();
    run();
    window.addEventListener('online', run);
    const timer = setInterval(run, RETRY_EVERY_MS);
    return () => {
      window.removeEventListener('online', run);
      clearInterval(timer);
    };
  }, [isAuthed, owner, qc]);
}