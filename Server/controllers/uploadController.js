import { createOriginalUploadSignature } from '../services/storageService.js';

export function signUpload(req, res) {
  const data = createOriginalUploadSignature(req.user._id);
  res.json({ success: true, data });
}
