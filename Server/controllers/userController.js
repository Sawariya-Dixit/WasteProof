export function getMe(req, res) {
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
}

export async function updateMe(req, res) {
  Object.assign(req.user, req.body);
  await req.user.save();
  res.json({ success: true, data: { user: req.user.toSafeJSON() } });
}