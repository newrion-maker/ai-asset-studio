import { useAppStore } from '../../store/appStore';
import { downloadImage } from '../../utils/imageUtils';

export const HistoryPanel = () => {
  const history = useAppStore((state) => state.history);
  const historyOpen = useAppStore((state) => state.historyOpen);
  const deleteAsset = useAppStore((state) => state.deleteAsset);

  if (!historyOpen) {
    return null;
  }

  return (
    <section className="border-t border-slate-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent History</h2>
        <span className="text-xs text-slate-500">{history.length}/20</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">Generated assets will appear here.</p>
        ) : (
          history.map((item) => (
            <article key={item.id} className="w-36 shrink-0 rounded-xl border border-gray-200 p-2 dark:border-gray-800">
              <img src={item.previewBase64} alt={item.name} className="aspect-square w-full rounded-lg bg-slate-100 object-contain" />
              <p className="mt-2 truncate text-xs font-medium">{item.name}</p>
              <div className="mt-2 flex gap-1">
                <button type="button" className="mini-btn" onClick={() => void downloadImage(item.previewBase64, item.name, 'png')}>
                  Save
                </button>
                <button type="button" className="mini-btn" onClick={() => deleteAsset(item.id)}>
                  Del
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
};
