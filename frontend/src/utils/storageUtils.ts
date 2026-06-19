import type { AssetItem } from '../types';

const DB_NAME = 'ai-asset-studio';
const DB_VERSION = 1;
const STORE_NAME = 'assets';

export const initDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('favorite', 'favorite', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const withStore = async <T>(mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<T>) => {
  const db = await initDB();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = callback(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const saveAssetToDB = (asset: AssetItem): Promise<IDBValidKey> =>
  withStore('readwrite', (store) => store.put(asset));

export const getAllAssets = (): Promise<AssetItem[]> => withStore('readonly', (store) => store.getAll());

export const deleteAssetFromDB = (id: string): Promise<undefined> =>
  withStore('readwrite', (store) => store.delete(id));

export const updateAssetInDB = (asset: AssetItem): Promise<IDBValidKey> => saveAssetToDB(asset);
