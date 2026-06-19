import { useCallback, useState } from 'react';
import type { ImagePlacement, SelectionRect } from '../types';
import { normalizeRect } from '../utils/imageUtils';
import { useAppStore } from '../store/appStore';

export const useSelection = (placement: ImagePlacement | null) => {
  const selection = useAppStore((state) => state.selection);
  const setSelection = useAppStore((state) => state.setSelection);
  const [isDrawing, setIsDrawing] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);

  const clampToImage = useCallback(
    (rect: SelectionRect): SelectionRect => {
      if (!placement) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }

      const normalized = normalizeRect(rect);
      const x = Math.max(placement.x, Math.min(normalized.x, placement.x + placement.width));
      const y = Math.max(placement.y, Math.min(normalized.y, placement.y + placement.height));
      const right = Math.max(x, Math.min(normalized.x + normalized.width, placement.x + placement.width));
      const bottom = Math.max(y, Math.min(normalized.y + normalized.height, placement.y + placement.height));
      return { x, y, width: right - x, height: bottom - y };
    },
    [placement],
  );

  const startDrawing = useCallback(
    (point: { x: number; y: number }) => {
      if (!placement) {
        return;
      }
      setOrigin(point);
      setIsDrawing(true);
      setSelection({ x: point.x, y: point.y, width: 0, height: 0 });
    },
    [placement, setSelection],
  );

  const updateDrawing = useCallback(
    (point: { x: number; y: number }) => {
      if (!isDrawing || !origin) {
        return;
      }
      setSelection(clampToImage({ x: origin.x, y: origin.y, width: point.x - origin.x, height: point.y - origin.y }));
    },
    [clampToImage, isDrawing, origin, setSelection],
  );

  const endDrawing = useCallback(() => {
    setIsDrawing(false);
    setOrigin(null);
    if (selection && (selection.width < 6 || selection.height < 6)) {
      setSelection(null);
    }
  }, [selection, setSelection]);

  const updateSelection = useCallback((next: SelectionRect) => setSelection(clampToImage(next)), [clampToImage, setSelection]);

  const clearSelection = useCallback(() => setSelection(null), [setSelection]);

  return { selection, isDrawing, startDrawing, updateDrawing, endDrawing, updateSelection, clearSelection };
};
