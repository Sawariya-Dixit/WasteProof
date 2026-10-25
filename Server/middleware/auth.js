import { AppError } from '../utils/AppError.js';
import { idTokenVerifier } from '../utils/cognito.js';
import { User } from '../models/User.js';

async function findOrCreateUser(payload) {
  const filter = { cognitoSub: payload.sub };
  const email = String(payload.email || '').toLowerCase();
  try {
    return await User.findOneAndUpdate(
      filter,
      { $setOnInsert: { email } },
      { upsert: true, returnDocument: 'after' },
    );
  } catch (err) {
    if (err.code === 11000) return User.findOne(filter);
    throw err;
  }
}

export async function protect(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Pehle login karo', 401, 'UNAUTHORIZED');
  }

  let payload;
  try {
    payload = await idTokenVerifier.verify(token);
  } catch (err) {
    const expired = /expired/i.test(err.message);
    throw new AppError(
      expired ? 'Token expire ho gaya' : 'Token galat hai',
      401,
      expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
    );
  }

  const user = await findOrCreateUser(payload);
  if (!user || user.status === 'blocked') {
    throw new AppError('Pehle login karo', 401, 'UNAUTHORIZED');
  }

  req.user = user;
  next();
}

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError('Aapko iski permission nahi hai', 403, 'FORBIDDEN');
    }
    next();
  };
