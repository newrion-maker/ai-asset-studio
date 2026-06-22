import { useAppStore } from '../../store/appStore';
import { useImageUpload } from '../../hooks/useImageUpload';
import { useT } from '../../i18n';

interface HeaderProps {
  upload: ReturnType<typeof useImageUpload>;
}

export const Header = ({ upload }: HeaderProps) => {
  const t = useT();
  const toggleHistory = useAppStore((state) => state.toggleHistory);
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen);
  const toggleDarkMode = useAppStore((state) => state.toggleDarkMode);
  const darkMode = useAppStore((state) => state.darkMode);
  const language = useAppStore((state) => state.language);
  const toggleLanguage = useAppStore((state) => state.toggleLanguage);

  return (
    <header className="border-b border-slate-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto flex max-w-[1640px] flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-950 dark:text-white">AI Asset Studio</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('app.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={upload.inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={upload.onInputChange}
          />
          <button type="button" className="btn-secondary" onClick={toggleLanguage}>
            {language === 'ko' ? 'EN' : '한국어'}
          </button>
          <button type="button" className="btn-secondary" onClick={toggleDarkMode}>
            {darkMode ? t('header.light') : t('header.dark')}
          </button>
          <button type="button" className="btn-secondary" onClick={toggleHistory}>
            {t('header.history')}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setSettingsOpen(true)}>
            {t('header.settings')}
          </button>
          <button type="button" className="btn-primary" onClick={upload.openFileDialog}>
            {t('header.upload')}
          </button>
        </div>
      </div>
    </header>
  );
};
