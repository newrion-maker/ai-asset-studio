import { clearAuthCookie } from '../_auth';

export default function handler(
  _req: unknown,
  res: { status: (code: number) => { json: (body: unknown) => void }; setHeader: (name: string, value: string) => void },
) {
  res.setHeader('Set-Cookie', clearAuthCookie());
  res.status(200).json({ ok: true });
}
