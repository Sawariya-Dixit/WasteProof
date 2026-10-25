import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { env } from '../config/env.js';

export const idTokenVerifier = CognitoJwtVerifier.create({
  userPoolId: env.COGNITO_USER_POOL_ID,
  tokenUse: 'id',
  clientId: env.COGNITO_CLIENT_ID,
});
