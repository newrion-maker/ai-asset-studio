import { useAppStore } from '../../store/appStore';
import { useT } from '../../i18n';

export const PromptPanel = () => {
  const t = useT();
  const prompt = useAppStore((state) => state.prompt);
  const setPrompt = useAppStore((state) => state.setPrompt);

  return (
    <section className="space-y-2">
      <label className="text-sm font-semibold text-slate-900 dark:text-white" htmlFor="prompt">
        {t('prompt.title')}
      </label>
      <textarea
        id="prompt"
        className="min-h-20 w-full resize-y rounded-xl border border-gray-200 bg-white p-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
        placeholder={t('prompt.placeholder')}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
      />
    </section>
  );
};
