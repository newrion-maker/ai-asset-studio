import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { useT } from '../../i18n';
import type { DownloadFormat } from '../../types';
import { downloadImage, generateFilename } from '../../utils/imageUtils';

type PreviewBackground = 'white' | 'gray' | 'black' | 'checker';

const backgrounds: PreviewBackground[] = ['white', 'gray', 'black', 'checker'];

export const ResultPanel = () => {
  const t = useT();
  const [format, setFormat] = useState<DownloadFormat>('png');
  const [background, setBackground] = useState<PreviewBackground>('checker');
  const result = useAppStore((state) => state.generateResult);
  const outputMode = useAppStore((state) => state.outputMode);
  const setGenerateResult = useAppStore((state) => state.setGenerateResult);
  const isJpgDisabled = outputMode === 'transparent';

  const backgroundClass = useMemo(() => {
    if (background === 'checker') {
      return 'checkerboard';
    }
    if (background === 'black') {
      return 'bg-black';
    }
    if (background === 'gray') {
      return 'bg-slate-200 dark:bg-slate-700';
    }
    return 'bg-white';
  }, [background]);

  return (
    <section className="flex min-h-0 flex-col rounded-xl bg-white p-3 shadow-soft dark:bg-gray-900">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t('result.title')}</h2>
        {outputMode === 'transparent' && (
          <div className="flex rounded-xl border border-gray-200 p-1 dark:border-gray-700">
            {backgrounds.map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded-lg px-2 py-1 text-xs capitalize ${
                  background === item ? 'bg-brand-500 text-white' : 'text-slate-500 dark:text-slate-300'
                }`}
                onClick={() => setBackground(item)}
              >
                {t(`bg.${item}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`flex min-h-[260px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-gray-200 ${backgroundClass} dark:border-gray-700`}>
        {result ? (
          <img src={result.resultImageBase64} alt="Generated result" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="px-4 text-center text-sm text-slate-500">{t('result.empty')}</span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-[92px_minmax(0,1fr)] gap-2">
        <select
          className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
          value={format}
          onChange={(event) => setFormat(event.target.value as DownloadFormat)}
        >
          <option value="png">PNG</option>
          <option value="webp">WEBP</option>
          <option value="jpg" disabled={isJpgDisabled}>
            JPG
          </option>
        </select>
        <button
          type="button"
          className="btn-primary justify-center"
          disabled={!result}
          onClick={() => {
            if (result) {
              void downloadImage(result.resultImageBase64, generateFilename(), format);
            }
          }}
        >
          {t('result.download')}
        </button>
      </div>
      <button type="button" className="btn-secondary mt-2 justify-center" disabled={!result} onClick={() => setGenerateResult(null)}>
        {t('result.delete')}
      </button>
    </section>
  );
};
