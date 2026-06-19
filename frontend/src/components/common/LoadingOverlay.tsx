import type { LoadingState } from '../../types';

const messages: Record<Exclude<LoadingState, 'idle'>, string> = {
  uploading: 'Uploading...',
  generating: 'Generating...',
  processing: 'Processing...',
  complete: 'Complete',
};

export const LoadingOverlay = ({ state }: { state: LoadingState }) => {
  if (state === 'idle') {
    return null;
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm dark:bg-gray-950/60">
      <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-900 shadow-md dark:bg-gray-900 dark:text-white">
        {state !== 'complete' && <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />}
        {messages[state]}
      </div>
    </div>
  );
};
