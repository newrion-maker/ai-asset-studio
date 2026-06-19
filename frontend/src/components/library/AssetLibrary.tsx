import { useAssetLibrary } from '../../hooks/useAssetLibrary';
import { downloadImage } from '../../utils/imageUtils';

export const AssetLibrary = () => {
  const library = useAssetLibrary();

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Asset Library</h2>
        <select
          className="rounded-xl border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-950"
          value={library.sortBy}
          onChange={(event) => library.setSortBy(event.target.value as typeof library.sortBy)}
        >
          <option value="date">Newest</option>
          <option value="favorite">Favorites</option>
          <option value="name">Name</option>
        </select>
      </div>
      <input
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-950"
        placeholder="Search assets or tags"
        value={library.query}
        onChange={(event) => library.setQuery(event.target.value)}
      />
      <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1">
        {library.assets.map((item) => (
          <article key={item.id} className="rounded-xl border border-gray-200 p-2 dark:border-gray-800">
            <img src={item.previewBase64} alt={item.name} className="aspect-square w-full rounded-lg bg-slate-100 object-contain" />
            <p className="mt-2 truncate text-xs font-medium">{item.name}</p>
            <div className="mt-2 grid grid-cols-3 gap-1">
              <button type="button" className="mini-btn" onClick={() => void library.toggleFavorite(item.id)}>
                {item.favorite ? 'Star' : 'Mark'}
              </button>
              <button type="button" className="mini-btn" onClick={() => void downloadImage(item.previewBase64, item.name, 'png')}>
                Save
              </button>
              <button type="button" className="mini-btn" onClick={() => void library.delete(item.id)}>
                Del
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
