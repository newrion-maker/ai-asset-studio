import { useAppStore } from '../../store/appStore';

export const PromptPanel = () => {
  const prompt = useAppStore((state) => state.prompt);
  const setPrompt = useAppStore((state) => state.setPrompt);

  return (
    <section className="space-y-2">
      <label className="text-sm font-semibold text-slate-900 dark:text-white" htmlFor="prompt">
        Optional Instructions
      </label>
      <textarea
        id="prompt"
        className="min-h-20 w-full resize-y rounded-xl border border-gray-200 bg-white p-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
        placeholder="Optional: add a short request, such as brighter colors or keep text."
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
      />
    </section>
  );
};
