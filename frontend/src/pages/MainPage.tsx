import { useEffect, useState } from 'react';
import { CanvasStage } from '../components/canvas/CanvasStage';
import { ApiKeySettings } from '../components/common/ApiKeySettings';
import { Modal } from '../components/common/Modal';
import { Header } from '../components/layout/Header';
import { Layout } from '../components/layout/Layout';
import { GenerateButton } from '../components/panel/GenerateButton';
import { GenerationSettingsPanel } from '../components/panel/GenerationSettingsPanel';
import { OutputModeSelector } from '../components/panel/OutputModeSelector';
import { PresetSelector } from '../components/panel/PresetSelector';
import { PreviewPanel } from '../components/panel/PreviewPanel';
import { PromptPanel } from '../components/panel/PromptPanel';
import { ResultPanel } from '../components/panel/ResultPanel';
import { useGenerate } from '../hooks/useGenerate';
import { useImageUpload } from '../hooks/useImageUpload';
import { useAppStore } from '../store/appStore';
import { useT } from '../i18n';
import type { ImagePlacement } from '../types';

export const MainPage = () => {
  const t = useT();
  const upload = useImageUpload();
  const [placement, setPlacement] = useState<ImagePlacement | null>(null);
  const { generate, cropOnly, canGenerate } = useGenerate(placement);
  const error = useAppStore((state) => state.error);
  const errorDetail = useAppStore((state) => state.errorDetail);
  const setError = useAppStore((state) => state.setError);
  const darkMode = useAppStore((state) => state.darkMode);
  const settingsOpen = useAppStore((state) => state.settingsOpen);
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <Layout>
      <div onDrop={upload.onDrop} onDragOver={upload.onDragOver}>
        <Header />
        <main className="mx-auto grid max-w-[1640px] gap-3 px-3 py-3">
          <input
            ref={upload.inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={upload.onInputChange}
          />
          <div className="grid gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
            <div className="grid min-h-[560px] gap-3">
              <CanvasStage onPlacementChange={setPlacement} />
              <div className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-soft dark:bg-gray-900">
                <button type="button" className="btn-secondary justify-center" onClick={upload.openFileDialog}>
                  {t('header.upload')}
                </button>
                <div className="flex-1 text-sm text-slate-500 dark:text-slate-400">
                  {canGenerate ? t('action.ready') : t('action.notReady')}
                </div>
                <button
                  type="button"
                  className="btn-secondary justify-center"
                  disabled={!canGenerate}
                  onClick={() => void cropOnly()}
                >
                  {t('action.cropOnly')}
                </button>
                <div className="min-w-[180px]">
                  <GenerateButton canGenerate={canGenerate} onGenerate={() => void generate()} />
                </div>
              </div>
            </div>
            <ResultPanel />
          </div>

          <section className="grid gap-3 rounded-xl bg-white p-3 shadow-soft dark:bg-gray-900 xl:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)_220px]">
            <PreviewPanel placement={placement} />
            <OutputModeSelector />
            <div className="space-y-3">
              <GenerationSettingsPanel />
              <PresetSelector />
            </div>
            <PromptPanel />
          </section>
        </main>
      </div>

      <Modal title={t('settings.title')} open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <ApiKeySettings />
      </Modal>

      <Modal title={t('error.title')} open={Boolean(error)} onClose={() => setError(null)}>
        <p className="text-sm text-slate-700 dark:text-slate-200">{error ? t(`error.${error}`) : null}</p>
        {errorDetail && (
          <p className="mt-3 rounded-xl bg-slate-100 p-3 text-xs leading-5 text-slate-600 dark:bg-gray-800 dark:text-slate-300">
            {errorDetail}
          </p>
        )}
      </Modal>
    </Layout>
  );
};
