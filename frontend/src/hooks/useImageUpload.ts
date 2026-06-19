import { useCallback, useEffect, useRef } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { loadImage } from '../utils/imageUtils';
import { useAppStore } from '../store/appStore';

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const SUPPORTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export const useImageUpload = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const setUploadedImage = useAppStore((state) => state.setUploadedImage);
  const setLoadingState = useAppStore((state) => state.setLoadingState);
  const setError = useAppStore((state) => state.setError);

  const processFile = useCallback(
    async (file: File) => {
      if (!SUPPORTED_TYPES.includes(file.type)) {
        setError('unsupported_file');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError('file_too_large');
        return;
      }

      setLoadingState('uploading');
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const image = await loadImage(dataUrl);
        setUploadedImage(image, dataUrl);
        setLoadingState('idle');
      } catch {
        setError('unsupported_file');
        setLoadingState('idle');
      }
    },
    [setError, setLoadingState, setUploadedImage],
  );

  const openFileDialog = useCallback(() => inputRef.current?.click(), []);

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        void processFile(file);
      }
      event.target.value = '';
    },
    [processFile],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files?.[0];
      if (file) {
        void processFile(file);
      }
    },
    [processFile],
  );

  const onDragOver = useCallback((event: DragEvent<HTMLElement>) => event.preventDefault(), []);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.files ?? []).find((item) => SUPPORTED_TYPES.includes(item.type));
      if (file) {
        void processFile(file);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [processFile]);

  return {
    inputRef,
    openFileDialog,
    onInputChange,
    onDrop,
    onDragOver,
  };
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
