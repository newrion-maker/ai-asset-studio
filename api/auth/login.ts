import { authCookie, getPassword } from '../_auth';

const readBody = (body: unknown): { password?: string } => {
  if (typeof body === 'string') {
    return JSON.parse(body) as { password?: string };
  }
  return (body ?? {}) as { password?: string };
};

export default function handler(
  req: { method?: string; body?: unknown },
  res: { status: (code: number) => { json: (body: unknown) => void }; setHeader: (name: string, value: string) => void },
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const password = getPassword();
  if (!password) {
    res.status(200).json({ ok: true });
    return;
  }

  const body = readBody(req.body);
  if (body.password !== password) {
    res.status(401).json({ error: 'unauthorized', message: 'Incorrect password.' });
    return;
  }

  res.setHeader('Set-Cookie', authCookie());
  res.status(200).json({ ok: true });
}
