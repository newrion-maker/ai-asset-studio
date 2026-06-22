import { useAppStore } from '../../store/appStore';
import { useT } from '../../i18n';
import type { FitMode, ResultAspectRatio, ResultSizePreset } from '../../types';

export const GenerationSettingsPanel = () => {
  const t = useT();
  const settings = useAppStore((state) => state.generationSettings);
  const setGenerationSettings = useAppStore((state) => state.setGenerationSettings);

  const aspectOptions: Array<{ value: ResultAspectRatio; label: string; hint: string }> = [
    { value: 'keep_selection', label: t('ratio.keep_selection'), hint: t('ratio.keep_selection.hint') },
    { value: '1:1', label: '1:1', hint: t('ratio.1:1.hint') },
    { value: '4:3', label: '4:3', hint: t('ratio.4:3.hint') },
    { value: '16:9', label: '16:9', hint: t('ratio.16:9.hint') },
    { value: '2:1', label: '2:1', hint: t('ratio.2:1.hint') },
  ];

  const sizeOptions: Array<{ value: ResultSizePreset; label: string; hint: string }> = [
    { value: 'tiny', label: t('size.tiny'), hint: '128px' },
    { value: 'small', label: t('size.small'), hint: '256px' },
    { value: 'preview', label: t('size.preview'), hint: '512px' },
    { value: 'standard', label: t('size.standard'), hint: '1024px' },
    { value: 'large', label: t('size.large'), hint: t('size.large.hint') },
  ];

  const fitOptions: Array<{ value: FitMode; label: string; hint: string }> = [
    { value: 'auto', label: t('fit.auto'), hint: t('fit.auto.hint') },
    { value: 'contain', label: t('fit.contain'), hint: t('fit.contain.hint') },
    { value: 'cover', label: t('fit.cover'), hint: t('fit.cover.hint') },
  ];

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t('settingsPanel.result')}</h2>
      <OptionRow
        label={t('settingsPanel.ratio')}
        options={aspectOptions}
        value={settings.aspectRatio}
        onChange={(value) => setGenerationSettings({ aspectRatio: value as ResultAspectRatio })}
      />
      <OptionRow
        label={t('settingsPanel.size')}
        options={sizeOptions}
        value={settings.sizePreset}
        onChange={(value) => setGenerationSettings({ sizePreset: value as ResultSizePreset })}
      />
      <OptionRow
        label={t('settingsPanel.fit')}
        options={fitOptions}
        value={settings.fitMode}
        onChange={(value) => setGenerationSettings({ fitMode: value as FitMode })}
      />
    </section>
  );
};

interface OptionRowProps<T extends string> {
  label: string;
  options: Array<{ value: T; label: string; hint: string }>;
  value: T;
  onChange: (value: T) => void;
}

const OptionRow = <T extends string>({ label, options, value, onChange }: OptionRowProps<T>) => (
  <div>
    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
    <div className="grid grid-cols-5 gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`rounded-lg border px-1.5 py-1.5 text-center transition ${
            value === option.value
              ? 'border-brand-500 bg-brand-500 text-white'
              : 'border-gray-200 bg-white text-slate-700 hover:border-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-slate-200'
          }`}
          onClick={() => onChange(option.value)}
        >
          <span className="block text-[11px] font-semibold">{option.label}</span>
          <span className={`mt-0.5 block text-[10px] ${value === option.value ? 'text-white/80' : 'text-slate-500'}`}>
            {option.hint}
          </span>
        </button>
      ))}
    </div>
  </div>
);
