import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { useT } from '../../i18n';

export const ApiKeySettings = () => {
  const t = useT();
  const apiKey = useAppStore((state) => state.apiKey);
  const setApiKey = useAppStore((state) => state.setApiKey);
  const [draft, setDraft] = useState(apiKey);

  return (
    <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200" htmlFor="api-key">
          {t('settings.apiKey.title')}
        </label>
        <input
          id="api-key"
          type="password"
          autoComplete="off"
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          placeholder={t('settings.apiKey.placeholder')}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="mt-2 flex gap-2">
          <button type="button" className="btn-primary justify-center px-4" onClick={() => setApiKey(draft)}>
            {t('settings.apiKey.save')}
          </button>
          <button
            type="button"
            className="btn-secondary justify-center px-4"
            onClick={() => {
              setDraft('');
              setApiKey('');
            }}
          >
            {t('settings.apiKey.clear')}
          </button>
        </div>
        {apiKey && <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{t('settings.apiKey.saved')}</p>}
      </div>
      <p className="rounded-xl bg-slate-100 p-3 text-xs leading-5 text-slate-600 dark:bg-gray-800 dark:text-slate-300">
        {t('settings.apiKey.notice')}
      </p>
      <a
        href="https://platform.openai.com/api-keys"
        target="_blank"
        rel="noreferrer noopener"
        className="btn-secondary inline-flex justify-center px-4 text-xs"
      >
        {t('settings.apiKey.getKey')} ↗
      </a>
      <p className="text-xs text-slate-500">{t('settings.storage')}</p>
    </div>
  );
};
