import { create } from 'zustand';

export const useQueueStore = create((set) => ({
  count: 0,
  dropped: 0,
  setCount: (count) => set({ count }),
  addDropped: (n) => set((s) => ({ dropped: s.dropped + n })),
  clearDropped: () => set({ dropped: 0 }),
}));