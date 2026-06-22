import { useAppStore } from '../../store/appStore';
import { useT } from '../../i18n';
import type { PresetStyle } from '../../types';

const presetValues: PresetStyle[] = [
  'original',
  'flat',
  'clay',
  '3d',
  'glass',
  'minimal',
  'gradient',
  'illustration',
  'isometric',
  'cartoon',
  'pictogram',
];

export const PresetSelector = () => {
  const t = useT();
  const selectedPreset = useAppStore((state) => state.selectedPreset);
  const setSelectedPreset = useAppStore((state) => state.setSelectedPreset);
  const presets = presetValues.map((value) => ({ value, label: t(`preset.${value}`) }));

  return (
    <section className="space-y-1.5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t('preset.title')}</h2>
      <div className="grid grid-cols-3 gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.value}
            type="button"
            className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
              selectedPreset === preset.value
                ? 'border-brand-500 bg-brand-500 text-white'
                : 'border-gray-200 bg-white text-slate-700 hover:border-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-slate-200'
            }`}
            onClick={() => setSelectedPreset(preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </section>
  );
};
