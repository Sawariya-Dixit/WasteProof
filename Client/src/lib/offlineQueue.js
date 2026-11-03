import { openDB } from 'idb';

const STORE = 'queue';
let dbPromise;
const db = () =>
  (dbPromise ??= openDB('junksnap', 1, {
    upgrade(d) {
      d.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    },
  }));

export const queueAdd = async (item) => (await db()).add(STORE, item);
export const queueAll = async () => (await db()).getAll(STORE);
export const queuePut = async (item) => (await db()).put(STORE, item);
export const queueRemove = async (id) => (await db()).delete(STORE, id);
export const queueCount = async () => (await db()).count(STORE);