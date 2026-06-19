import type { ReactNode } from 'react';

export const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-[#f7f8fb] text-slate-950 dark:bg-gray-950 dark:text-white">{children}</div>
);
