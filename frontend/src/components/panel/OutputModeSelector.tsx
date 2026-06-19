import { useAppStore } from '../../store/appStore';
import type { OutputMode } from '../../types';

const modes: Array<{ value: OutputMode; label: string; description: string }> = [
  {
    value: 'keep_background',
    label: 'Keep Background',
    description: 'Preserve background, lighting, and atmosphere.',
  },
  {
    value: 'transparent',
    label: 'Transparent',
    description: 'Extract the main object as a clean PNG asset.',
  },
  {
    value: 'smart_auto',
    label: 'Smart Auto',
    description: 'Let AI choose the best output treatment.',
  },
];

export const OutputModeSelector = () => {
  const outputMode = useAppStore((state) => state.outputMode);
  const setOutputMode = useAppStore((state) => state.setOutputMode);

  return (
    <section className="space-y-1.5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Output Mode</h2>
      <div className="grid grid-cols-3 gap-1.5">
        {modes.map((mode) => (
          <button
            key={mode.value}
            type="button"
            className={`rounded-lg border p-2 text-left transition ${
              outputMode === mode.value
                ? 'border-brand-500 bg-brand-500 text-white'
                : 'border-gray-200 bg-white text-slate-900 hover:border-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white'
            }`}
            onClick={() => setOutputMode(mode.value)}
          >
            <span className="block text-xs font-semibold leading-tight">{mode.label}</span>
            <span className={`mt-1 block text-xs ${outputMode === mode.value ? 'text-white/85' : 'text-slate-500 dark:text-slate-400'}`}>
              {mode.description}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
