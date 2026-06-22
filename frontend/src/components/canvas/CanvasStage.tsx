import { useEffect, useMemo, useRef, useState } from 'react';
import { Image as KonvaImage, Layer, Rect, Stage } from 'react-konva';
import type Konva from 'konva';
import { useSelection } from '../../hooks/useSelection';
import { useAppStore } from '../../store/appStore';
import type { ImagePlacement } from '../../types';
import { getImagePlacement } from '../../utils/imageUtils';
import { LoadingOverlay } from '../common/LoadingOverlay';
import { SelectionLayer } from './SelectionLayer';

interface CanvasStageProps {
  onPlacementChange: (placement: ImagePlacement | null) => void;
}

const EMPTY_STAGE_HEIGHT = 560;
const WORK_STAGE_MIN_HEIGHT = 560;
const WORK_STAGE_MAX_HEIGHT = 820;

export const CanvasStage = ({ onPlacementChange }: CanvasStageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const uploadedImage = useAppStore((state) => state.uploadedImage);
  const loadingState = useAppStore((state) => state.loadingState);
  const clearUploadedImage = useAppStore((state) => state.clearUploadedImage);
  const darkMode = useAppStore((state) => state.darkMode);
  const [stageSize, setStageSize] = useState({ width: 720, height: EMPTY_STAGE_HEIGHT });
  const [spacePressed, setSpacePressed] = useState(false);

  useEffect(() => {
    const resize = () => {
      const width = containerRef.current?.clientWidth ?? 720;
      const workHeight = Math.min(WORK_STAGE_MAX_HEIGHT, Math.max(WORK_STAGE_MIN_HEIGHT, Math.round(window.innerHeight - 230)));
      setStageSize({ width, height: uploadedImage ? workHeight : EMPTY_STAGE_HEIGHT });
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [uploadedImage]);

  const placement = useMemo(
    () => (uploadedImage ? getImagePlacement(uploadedImage, stageSize.width, stageSize.height) : null),
    [stageSize.height, stageSize.width, uploadedImage],
  );

  const setSelectionMode = useAppStore((state) => state.setSelectionMode);
  const {
    selectionMode,
    selection,
    isDrawing,
    startDrawing,
    updateDrawing,
    endDrawing,
    updateSelection,
    polygon,
    polygonClosed,
    polygonCursor,
    addPolygonPoint,
    updatePolygonCursor,
    closePolygon,
    undoPolygonPoint,
    movePolygonVertex,
    clearSelection,
  } = useSelection(placement);

  const changeMode = (mode: typeof selectionMode) => {
    clearSelection();
    setSelectionMode(mode);
  };

  useEffect(() => {
    onPlacementChange(placement);
  }, [onPlacementChange, placement]);

  useEffect(() => {
    if (!uploadedImage) {
      clearSelection();
      stageRef.current?.scale({ x: 1, y: 1 });
      stageRef.current?.position({ x: 0, y: 0 });
      return;
    }
    clearSelection();
    stageRef.current?.scale({ x: 1, y: 1 });
    stageRef.current?.position({ x: 0, y: 0 });
  }, [clearSelection, uploadedImage]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpacePressed(true);
      }
      if (event.key === 'Escape') {
        clearSelection();
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        clearSelection();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpacePressed(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [clearSelection]);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl bg-white shadow-soft dark:bg-gray-900"
      onDrop={(event) => event.preventDefault()}
      onDragOver={(event) => event.preventDefault()}
    >
      <LoadingOverlay state={loadingState} />
      {uploadedImage && (
        <button
          type="button"
          className="absolute right-3 top-3 z-10 rounded-xl bg-slate-950/80 px-3 py-2 text-sm font-semibold text-white shadow-md backdrop-blur transition hover:bg-slate-950 dark:bg-white/90 dark:text-slate-950 dark:hover:bg-white"
          onClick={clearUploadedImage}
        >
          Clear Image
        </button>
      )}
      {uploadedImage && (
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
          <div className="flex overflow-hidden rounded-xl bg-slate-950/80 p-1 shadow-md backdrop-blur dark:bg-white/90">
            {(['rectangle', 'polygon'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  selectionMode === mode
                    ? 'bg-white text-slate-950 dark:bg-slate-950 dark:text-white'
                    : 'text-white/80 hover:text-white dark:text-slate-950/70 dark:hover:text-slate-950'
                }`}
                onClick={() => changeMode(mode)}
              >
                {mode === 'rectangle' ? 'Rectangle' : 'Lasso'}
              </button>
            ))}
          </div>
          {selectionMode === 'polygon' && polygon && polygon.length > 0 && (
            <div className="flex gap-1">
              <button
                type="button"
                className="rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur transition hover:bg-slate-950 disabled:opacity-40 dark:bg-white/90 dark:text-slate-950"
                onClick={undoPolygonPoint}
              >
                Undo
              </button>
              {!polygonClosed && (
                <button
                  type="button"
                  className="rounded-lg bg-blue-600/90 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur transition hover:bg-blue-600 disabled:opacity-40"
                  onClick={closePolygon}
                  disabled={polygon.length < 3}
                >
                  Close
                </button>
              )}
              <button
                type="button"
                className="rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur transition hover:bg-slate-950 dark:bg-white/90 dark:text-slate-950"
                onClick={clearSelection}
              >
                Reset
              </button>
            </div>
          )}
          {selectionMode === 'polygon' && (
            <p className="max-w-[220px] rounded-lg bg-slate-950/70 px-2.5 py-1.5 text-[11px] leading-4 text-white/90 shadow-md backdrop-blur dark:bg-white/85 dark:text-slate-900">
              {polygonClosed
                ? 'Drag points to adjust the shape.'
                : 'Click to add points. Click the green start point or "Close" to finish.'}
            </p>
          )}
        </div>
      )}
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        draggable={spacePressed}
        onWheel={(event) => {
          event.evt.preventDefault();
          const stage = event.target.getStage();
          if (!stage) {
            return;
          }
          const oldScale = stage.scaleX();
          const pointer = stage.getPointerPosition();
          if (!pointer) {
            return;
          }
          const scaleBy = 1.04;
          const direction = event.evt.deltaY > 0 ? -1 : 1;
          const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
          const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
          };
          stage.scale({ x: newScale, y: newScale });
          stage.position({
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
          });
        }}
        onMouseDown={(event) => {
          if (selectionMode !== 'rectangle' || spacePressed || !placement || event.target.name() !== 'canvas-bg') {
            return;
          }
          const pointer = event.target.getStage()?.getRelativePointerPosition();
          if (pointer) {
            startDrawing(pointer);
          }
        }}
        onMouseMove={(event) => {
          if (!placement) {
            return;
          }
          const pointer = event.target.getStage()?.getRelativePointerPosition();
          if (!pointer) {
            return;
          }
          if (selectionMode === 'rectangle') {
            updateDrawing(pointer);
          } else {
            updatePolygonCursor(pointer);
          }
        }}
        onMouseUp={() => {
          if (selectionMode === 'rectangle') {
            endDrawing();
          }
        }}
        onClick={(event) => {
          if (selectionMode !== 'polygon' || spacePressed || !placement || event.target.name() !== 'canvas-bg') {
            return;
          }
          const pointer = event.target.getStage()?.getRelativePointerPosition();
          if (pointer) {
            addPolygonPoint(pointer);
          }
        }}
      >
        <Layer>
          <Rect name="canvas-bg" width={stageSize.width} height={stageSize.height} fill={darkMode ? '#111827' : '#f8fafc'} />
          {uploadedImage && placement && (
            <KonvaImage
              image={uploadedImage}
              x={placement.x}
              y={placement.y}
              width={placement.width}
              height={placement.height}
              listening={false}
            />
          )}
        </Layer>
        {uploadedImage && placement && (
          <Layer>
            <SelectionLayer
              selectionMode={selectionMode}
              selection={selection}
              isDrawing={isDrawing}
              onChange={updateSelection}
              polygon={polygon}
              polygonClosed={polygonClosed}
              polygonCursor={polygonCursor}
              onVertexMove={movePolygonVertex}
            />
          </Layer>
        )}
      </Stage>
      {!uploadedImage && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/85 px-8 py-7 shadow-sm dark:border-slate-700 dark:bg-gray-950/85">
            <p className="text-base font-semibold text-slate-900 dark:text-white">Drop, paste, or upload an image</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">PNG, JPEG, WEBP up to 30MB</p>
          </div>
        </div>
      )}
    </section>
  );
};
