import type { GenerateRequest, GenerateResult } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export interface AuthStatus {
  authRequired: boolean;
  authenticated: boolean;
}

export const apiAuthStatus = async (): Promise<AuthStatus> => {
  const response = await fetch(`${API_BASE}/api/auth/status`, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('auth_status_failed');
  }
  return response.json() as Promise<AuthStatus>;
};

export const apiLogin = async (password: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    throw new Error('Incorrect password.');
  }
};

export const apiGenerate = async (req: GenerateRequest): Promise<GenerateResult> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/generate`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(170_000),
    });
  } catch (error) {
    if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new Error('timeout');
    }
    throw new Error('network_error');
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    if (errorBody?.error === 'no_api_key' || errorBody?.error === 'invalid_api_key') {
      throw new Error(errorBody.error);
    }
    throw new Error(errorBody?.message ?? errorBody?.error ?? `api_error:${response.status}`);
  }

  try {
    return (await response.json()) as GenerateResult;
  } catch {
    throw new Error('timeout');
  }
};
