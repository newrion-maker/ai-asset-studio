import { useAppStore } from '../../store/appStore';
import { useT } from '../../i18n';
import type { OutputMode } from '../../types';

const modeValues: OutputMode[] = ['keep_background', 'transparent', 'smart_auto', 'eraser', 'solid_fill'];

export const OutputModeSelector = () => {
  const t = useT();
  const outputMode = useAppStore((state) => state.outputMode);
  const setOutputMode = useAppStore((state) => state.setOutputMode);
  const modes = modeValues.map((value) => ({
    value,
    label: t(`outputMode.${value}`),
    description: t(`outputMode.${value}.desc`),
  }));

  return (
    <section className="space-y-1.5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t('outputMode.title')}</h2>
      <div className="grid grid-cols-2 gap-1.5">
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
