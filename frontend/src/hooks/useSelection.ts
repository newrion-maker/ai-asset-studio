import { useCallback, useState } from 'react';
import type { ImagePlacement, Point, SelectionRect } from '../types';
import { normalizeRect, polygonBounds } from '../utils/imageUtils';
import { useAppStore } from '../store/appStore';

// Distance (in stage pixels) within which clicking the first vertex closes the polygon.
const CLOSE_DISTANCE = 12;

export const useSelection = (placement: ImagePlacement | null) => {
  const selection = useAppStore((state) => state.selection);
  const setSelection = useAppStore((state) => state.setSelection);
  const selectionMode = useAppStore((state) => state.selectionMode);
  const polygon = useAppStore((state) => state.polygon);
  const polygonClosed = useAppStore((state) => state.polygonClosed);
  const setPolygon = useAppStore((state) => state.setPolygon);
  const [isDrawing, setIsDrawing] = useState(false);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [cursor, setCursor] = useState<Point | null>(null);

  const clampPoint = useCallback(
    (point: Point): Point => {
      if (!placement) {
        return point;
      }
      return {
        x: Math.max(placement.x, Math.min(point.x, placement.x + placement.width)),
        y: Math.max(placement.y, Math.min(point.y, placement.y + placement.height)),
      };
    },
    [placement],
  );

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

  // ---- Rectangle mode ----
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

  // ---- Polygon mode ----
  const syncPolygonSelection = useCallback(
    (points: Point[]) => {
      if (points.length >= 3) {
        setSelection(polygonBounds(points));
      } else {
        setSelection(null);
      }
    },
    [setSelection],
  );

  const closePolygon = useCallback(() => {
    if (!polygon || polygon.length < 3) {
      return;
    }
    setPolygon(polygon, true);
    syncPolygonSelection(polygon);
    setCursor(null);
  }, [polygon, setPolygon, syncPolygonSelection]);

  const addPolygonPoint = useCallback(
    (point: Point) => {
      if (!placement || polygonClosed) {
        return;
      }
      const next = clampPoint(point);
      const current = polygon ?? [];
      // Clicking near the starting vertex closes the shape.
      if (current.length >= 3) {
        const first = current[0];
        if (Math.hypot(first.x - next.x, first.y - next.y) <= CLOSE_DISTANCE) {
          setPolygon(current, true);
          syncPolygonSelection(current);
          setCursor(null);
          return;
        }
      }
      const points = [...current, next];
      setPolygon(points, false);
    },
    [clampPoint, placement, polygon, polygonClosed, setPolygon, syncPolygonSelection],
  );

  const updatePolygonCursor = useCallback(
    (point: Point) => {
      if (polygonClosed || !polygon || polygon.length === 0) {
        setCursor(null);
        return;
      }
      setCursor(clampPoint(point));
    },
    [clampPoint, polygon, polygonClosed],
  );

  const undoPolygonPoint = useCallback(() => {
    if (!polygon || polygon.length === 0) {
      return;
    }
    const points = polygon.slice(0, -1);
    setPolygon(points.length ? points : null, false);
    syncPolygonSelection(points);
  }, [polygon, setPolygon, syncPolygonSelection]);

  const movePolygonVertex = useCallback(
    (index: number, point: Point) => {
      if (!polygon) {
        return;
      }
      const points = polygon.map((existing, i) => (i === index ? clampPoint(point) : existing));
      setPolygon(points, polygonClosed);
      if (polygonClosed) {
        syncPolygonSelection(points);
      }
    },
    [clampPoint, polygon, polygonClosed, setPolygon, syncPolygonSelection],
  );

  const clearSelection = useCallback(() => {
    setSelection(null);
    setPolygon(null, false);
    setCursor(null);
    setIsDrawing(false);
    setOrigin(null);
  }, [setPolygon, setSelection]);

  return {
    selectionMode,
    selection,
    isDrawing,
    startDrawing,
    updateDrawing,
    endDrawing,
    updateSelection,
    polygon,
    polygonClosed,
    polygonCursor: cursor,
    addPolygonPoint,
    updatePolygonCursor,
    closePolygon,
    undoPolygonPoint,
    movePolygonVertex,
    clearSelection,
  };
};
