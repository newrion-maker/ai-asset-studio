import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const COOKIE_NAME = 'asset_studio_auth';

const getPassword = (): string | null => {
  const password = process.env.APP_PASSWORD?.trim();
  return password ? password : null;
};

const getAuthSecret = (): string => process.env.AUTH_SECRET ?? process.env.OPENAI_API_KEY ?? 'local-dev-secret';

const createToken = (): string => crypto.createHmac('sha256', getAuthSecret()).update(getPassword() ?? '').digest('hex');

const parseCookies = (cookieHeader: string | undefined): Record<string, string> => {
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

export const isAuthenticated = (req: Request): boolean => {
  if (!isAuthEnabled()) {
    return true;
  }
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  return token === createToken();
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (isAuthenticated(req)) {
    next();
    return;
  }
  res.status(401).json({ error: 'unauthorized', message: 'Password is required.' });
};

export const handleAuthStatus = (req: Request, res: Response) => {
  res.json({ authRequired: isAuthEnabled(), authenticated: isAuthenticated(req) });
};

export const handleLogin = (req: Request, res: Response) => {
  const password = getPassword();
  if (!password) {
    res.json({ ok: true });
    return;
  }
  if ((req.body as { password?: string }).password !== password) {
    res.status(401).json({ error: 'unauthorized', message: 'Incorrect password.' });
    return;
  }
  res.cookie(COOKIE_NAME, createToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
  res.json({ ok: true });
};

export const handleLogout = (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
};
