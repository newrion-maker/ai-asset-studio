import crypto from 'node:crypto';

export const COOKIE_NAME = 'asset_studio_auth';

export const getPassword = (): string | null => {
  const password = process.env.APP_PASSWORD?.trim();
  return password ? password : null;
};

const getSecret = (): string => process.env.AUTH_SECRET ?? process.env.OPENAI_API_KEY ?? 'vercel-dev-secret';

export const createToken = (): string => crypto.createHmac('sha256', getSecret()).update(getPassword() ?? '').digest('hex');

export const parseCookies = (cookieHeader: string | undefined): Record<string, string> => {
  if (!cookieHeader) {
    return {};
  }
  return Object.fromEntries(
    cookieHeader.split(';').map((cookie) => {
      const [name, ...value] = cookie.trim().split('=');
      return [name, decodeURIComponent(value.join('='))];
    }),
  );
};

export const isAuthEnabled = (): boolean => Boolean(getPassword());

export const isAuthenticated = (cookieHeader: string | undefined): boolean => {
  if (!isAuthEnabled()) {
    return true;
  }
  return parseCookies(cookieHeader)[COOKIE_NAME] === createToken();
};

export const authCookie = (): string =>
  `${COOKIE_NAME}=${encodeURIComponent(createToken())}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000; Secure`;

export const clearAuthCookie = (): string => `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`;
