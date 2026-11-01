// Bytes ka SHA-256 (64 hex). Hash wahi blob ka nikalo jo upload hoga (compress hone ke baad).
export async function sha256Hex(blob) {
  if (!globalThis.crypto?.subtle) throw new Error('INSECURE_CONTEXT');
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}
