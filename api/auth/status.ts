import { isAuthEnabled, isAuthenticated } from '../_auth';

export default function handler(req: { headers: { cookie?: string } }, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  res.status(200).json({
    authRequired: isAuthEnabled(),
    authenticated: isAuthenticated(req.headers.cookie),
  });
}
