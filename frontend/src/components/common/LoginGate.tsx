import { useEffect, useState, type ReactNode } from 'react';
import { apiAuthStatus, apiLogin } from '../../services/api';

export const LoginGate = ({ children }: { children: ReactNode }) => {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiAuthStatus()
      .then((status) => setAuthenticated(!status.authRequired || status.authenticated))
      .catch(() => setAuthenticated(true))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-950 text-white">Loading...</div>;
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-white">
        <form
          className="w-full max-w-sm rounded-2xl bg-gray-900 p-6 shadow-soft"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            void apiLogin(password)
              .then(() => setAuthenticated(true))
              .catch((loginError: unknown) => {
                setError(loginError instanceof Error ? loginError.message : 'Login failed.');
              });
          }}
        >
          <h1 className="text-xl font-semibold">AI Asset Studio</h1>
          <p className="mt-2 text-sm text-slate-400">Enter your private password to continue.</p>
          <input
            type="password"
            className="mt-5 w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-3 text-white outline-none focus:ring-2 focus:ring-brand-500"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
          />
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          <button type="submit" className="btn-primary mt-5 w-full justify-center" disabled={!password}>
            Enter
          </button>
        </form>
      </div>
    );
  }

  return children;
};
