import { Amplify } from 'aws-amplify';
import {
  signUp,
  confirmSignUp,
  resendSignUpCode,
  signIn,
  signOut,
  resetPassword,
  confirmResetPassword,
  fetchAuthSession,
} from 'aws-amplify/auth';

// Import hote hi Amplify configure ho jata hai (main.jsx me sabse pehle import karo)


Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID
    }
  }
});


export const registerUser = (email, password) =>
  signUp({ username: email, password, options: { userAttributes: { email } } });

export const confirmRegistration = (email, code) =>
  confirmSignUp({ username: email, confirmationCode: code });

export const resendCode = (email) => resendSignUpCode({ username: email });

export async function loginUser(email, password) {
  try {
    return await signIn({ username: email, password });
  } catch (err) {
    // Pehle se login hai to purana session hatao, phir dobara
    if (err.name === 'UserAlreadyAuthenticatedException') {
      await signOut();
      return signIn({ username: email, password });
    }
    throw err;
  }
}

export const logoutUser = () => signOut();

export const requestPasswordReset = (email) => resetPassword({ username: email });

export const confirmPasswordReset = (email, code, newPassword) =>
  confirmResetPassword({ username: email, confirmationCode: code, newPassword });

// Backend ko ID token chahiye (access token nahi)
export async function getIdToken() {
  try {
    const { tokens } = await fetchAuthSession();
    return tokens?.idToken?.toString() ?? null;
  } catch {
    return null;
  }
}

// Cognito ka error -> i18n key
export function cognitoErrorKey(err) {
  switch (err?.name) {
    case 'UsernameExistsException':
      return 'errors.emailExists';
    case 'NotAuthorizedException':
    case 'UserNotFoundException':
      return 'errors.wrongCredentials';
    case 'CodeMismatchException':
      return 'errors.wrongCode';
    case 'ExpiredCodeException':
      return 'errors.codeExpired';
    case 'LimitExceededException':
    case 'TooManyRequestsException':
    case 'TooManyFailedAttemptsException':
      return 'errors.tooMany';
    case 'InvalidPasswordException':
      return 'errors.weakPassword';
    case 'NetworkError':
      return 'errors.network';
    default:
      return err?.code === 'NETWORK_ERROR' ? 'errors.network' : 'errors.generic';
  }
}
