import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AssetItem } from '../types';
import { deleteAssetFromDB, getAllAssets, saveAssetToDB, updateAssetInDB } from '../utils/storageUtils';
import { useAppStore } from '../store/appStore';

export type AssetSort = 'date' | 'favorite' | 'name';

export const useAssetLibrary = () => {
  const assetLibrary = useAppStore((state) => state.assetLibrary);
  const setAssetLibrary = useAppStore((state) => state.setAssetLibrary);
  const deleteAssetFromStore = useAppStore((state) => state.deleteAsset);
  const toggleFavoriteInStore = useAppStore((state) => state.toggleFavorite);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<AssetSort>('date');

  const load = useCallback(async () => {
    const assets = await getAllAssets();
    setAssetLibrary(assets.sort((a, b) => b.date.localeCompare(a.date)));
  }, [setAssetLibrary]);

  const save = useCallback(async (item: AssetItem) => {
    await saveAssetToDB(item);
  }, []);

  const remove = useCallback(
    async (id: string) => {
      await deleteAssetFromDB(id);
      deleteAssetFromStore(id);
    },
    [deleteAssetFromStore],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const asset = assetLibrary.find((item) => item.id === id);
      if (!asset) {
        return;
      }
      const next = { ...asset, favorite: !asset.favorite };
      await updateAssetInDB(next);
      toggleFavoriteInStore(id);
    },
    [assetLibrary, toggleFavoriteInStore],
  );

  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...assetLibrary]
      .filter((asset) => {
        if (!normalizedQuery) {
          return true;
        }
        return (
          asset.name.toLowerCase().includes(normalizedQuery) ||
          asset.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'favorite') {
          return Number(b.favorite) - Number(a.favorite) || b.date.localeCompare(a.date);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return b.date.localeCompare(a.date);
      });
  }, [assetLibrary, query, sortBy]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    assets: filteredAssets,
    query,
    sortBy,
    setQuery,
    setSortBy,
    load,
    save,
    delete: remove,
    toggleFavorite,
  };
};
