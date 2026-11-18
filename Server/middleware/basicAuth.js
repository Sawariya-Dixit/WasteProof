import crypto from 'node:crypto';

// HTTPS ke bina Basic auth ka password saaf text me jata hai: production me sirf HTTPS par chalao.
const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();

export function basicAuth(user, pass) {
  const wantUser = sha(user);
  const wantPass = sha(pass);
  return (req, res, next) => {
    const [scheme, encoded] = (req.headers.authorization || '').split(' ');
    if (scheme === 'Basic' && encoded) {
      const raw = Buffer.from(encoded, 'base64').toString('utf8');
      const i = raw.indexOf(':');
      if (i > -1) {
        // Dono hash barabar lambai ke hain, timingSafeEqual se time se andaza nahi lagta
        const okUser = crypto.timingSafeEqual(sha(raw.slice(0, i)), wantUser);
        const okPass = crypto.timingSafeEqual(sha(raw.slice(i + 1)), wantPass);
        if (okUser && okPass) return next();
      }
    }
    res.set('WWW-Authenticate', 'Basic realm="JunkSnap ops", charset="UTF-8"');
    res.status(401).send('Login required');
  };
}