import { useEffect, useState } from 'react';
import { CanvasStage } from '../components/canvas/CanvasStage';
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
import type { ErrorType, ImagePlacement } from '../types';

const errorMessages: Record<ErrorType, string> = {
  unsupported_file: 'Unsupported file. Please upload PNG, JPEG, or WEBP.',
  file_too_large: 'File is too large. Please use a file under 30MB.',
  no_selection: 'Please select an area from the image first.',
  config_error: 'OpenAI API key is not configured on the backend.',
  billing_limit: 'OpenAI billing limit has been reached. Please check API billing settings.',
  api_error: 'AI generation failed. Please try again.',
  timeout: 'The request timed out. Please check the network and try again.',
  network_error: 'Network connection failed. Please check the backend server.',
};

export const MainPage = () => {
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
        <Header upload={upload} />
        <main className="grid gap-3 px-3 py-3">
          <div className="grid min-h-[520px] gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(320px,3fr)]">
            <CanvasStage onPlacementChange={setPlacement} />
            <ResultPanel />
          </div>

          <section className="grid gap-3 rounded-xl bg-white p-3 shadow-soft dark:bg-gray-900 xl:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)_220px]">
            <PreviewPanel placement={placement} />
            <OutputModeSelector />
            <div className="space-y-3">
              <GenerationSettingsPanel />
              <PresetSelector />
            </div>
            <div className="space-y-3">
              <PromptPanel />
              <div className="grid grid-cols-2 gap-2">
                <GenerateButton canGenerate={canGenerate} onGenerate={() => void generate()} />
                <button
                  type="button"
                  className="btn-secondary w-full justify-center"
                  disabled={!canGenerate}
                  onClick={() => void cropOnly()}
                >
                  Crop Only
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Modal title="Settings" open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p>OpenAI API key is configured on the backend only.</p>
          <p>Frontend endpoint: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}</p>
          <p>Images are stored locally in this browser through IndexedDB.</p>
        </div>
      </Modal>

      <Modal title="Error" open={Boolean(error)} onClose={() => setError(null)}>
        <p className="text-sm text-slate-700 dark:text-slate-200">{error ? errorMessages[error] : null}</p>
        {errorDetail && (
          <p className="mt-3 rounded-xl bg-slate-100 p-3 text-xs leading-5 text-slate-600 dark:bg-gray-800 dark:text-slate-300">
            {errorDetail}
          </p>
        )}
      </Modal>
    </Layout>
  );
};
