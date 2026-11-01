import path from 'node:path';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { FACE_BLUR } from '../config/defaults.js';
import { logger } from '../utils/logger.js';

const require = createRequire(import.meta.url);

// Human apni model files file:// se padhta hai, par Node ka fetch file:// nahi samajhta.
// Sirf file:// ke liye chhota patch. Baaki http/https requests waise hi chalti hain.
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  const u = String(url);
  if (!u.startsWith('file://')) return realFetch(url, opts);
  try {
    return new Response(await fs.readFile(fileURLToPath(u)), { status: 200 });
  } catch {
    return new Response(null, { status: 404 });
  }
};

async function createHuman() {
  // Human ke package.json ke exports ki wajah se seedha import nahi hota, isliye path nikaal ke require
  const humanDist = path.dirname(require.resolve('@vladmandic/human'));
  const modelsDir = path.join(
    path.dirname(require.resolve('@vladmandic/human-models/package.json')),
    'models',
  );
  const wasmDir = path.dirname(require.resolve('@tensorflow/tfjs-backend-wasm'));

  const mod = require(path.join(humanDist, 'human.node-wasm.js'));
  const Human = mod.Human || mod.default || mod;

  const human = new Human({
    backend: 'wasm',
    wasmPath: wasmDir + path.sep,
    modelBasePath: pathToFileURL(modelsDir + path.sep).href,
    debug: false,
    async: false,
    cacheSensitivity: 0,
    face: {
      enabled: true,
      detector: {
        enabled: true,
        rotation: false,
        maxDetected: 50,
        minConfidence: FACE_BLUR.minConfidence,
        modelPath: 'blazeface-back.json', // door ke chehron ke liye
      },
      mesh: { enabled: false },
      iris: { enabled: false },
      description: { enabled: false },
      emotion: { enabled: false },
      antispoof: { enabled: false },
      liveness: { enabled: false },
    },
    body: { enabled: false },
    hand: { enabled: false },
    object: { enabled: false },
    gesture: { enabled: false },
    segmentation: { enabled: false },
    filter: { enabled: false },
  });
  await human.load();
  logger.info('Face detector ready (human, wasm)');
  return human;
}

let humanPromise = null;
function getHuman() {
  if (!humanPromise) {
    humanPromise = createHuman().catch((err) => {
      humanPromise = null; // agli baar dobara try ho
      throw err;
    });
  }
  return humanPromise;
}

// Ek hi model instance hai, isliye detections ek ke baad ek chalao (concurrency 2-4 me bhi safe)
let chain = Promise.resolve();
export function detectFaces(raw) {
  const job = chain.then(() => runDetect(raw));
  chain = job.catch(() => {});
  return job;
}

// raw = { data: Buffer(RGB), info: { width, height } }. Return: [{ x, y, w, h }] pixels me
async function runDetect({ data, info }) {
  const human = await getHuman();
  const tensor = human.tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3], 'int32');
  try {
    const res = await human.detect(tensor);
    return res.face.map((f) => ({ x: f.box[0], y: f.box[1], w: f.box[2], h: f.box[3] }));
  } finally {
    tensor.dispose();
  }
}