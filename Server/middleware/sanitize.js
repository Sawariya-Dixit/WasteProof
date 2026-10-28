// NoSQL injection se bachav. `express-mongo-sanitize` Express 5 me crash karta hai
// (req.query ab read-only hai), isliye chhota apna version.
// Body se woh keys hata deta hai jo '$' se shuru hon ya jisme '.' ho.
function clean(value) {
  if (Array.isArray(value)) {
    value.forEach(clean);
  } else if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) delete value[key];
      else clean(value[key]);
    }
  }
}

export function sanitize(req, res, next) {
  clean(req.body);
  next();
}
