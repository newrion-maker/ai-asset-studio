import { useAppStore } from '../../store/appStore';
import { useT } from '../../i18n';

interface GenerateButtonProps {
  canGenerate: boolean;
  onGenerate: () => void;
}

export const GenerateButton = ({ canGenerate, onGenerate }: GenerateButtonProps) => {
  const t = useT();
  const loadingState = useAppStore((state) => state.loadingState);
  const disabled = !canGenerate || loadingState !== 'idle';

  return (
    <button type="button" className="btn-primary w-full justify-center" disabled={disabled} onClick={onGenerate}>
      {loadingState !== 'idle' && loadingState !== 'complete' ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : null}
      {t('action.generate')}
    </button>
  );
};
