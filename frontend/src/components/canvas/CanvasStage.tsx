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

const EMPTY_STAGE_HEIGHT = 340;
const WORK_STAGE_MIN_HEIGHT = 460;
const WORK_STAGE_MAX_HEIGHT = 640;

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

  const { selection, isDrawing, startDrawing, updateDrawing, endDrawing, updateSelection, clearSelection } =
    useSelection(placement);

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
          if (spacePressed || !placement || event.target.name() !== 'canvas-bg') {
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
          if (pointer) {
            updateDrawing(pointer);
          }
        }}
        onMouseUp={endDrawing}
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
            <SelectionLayer selection={selection} isDrawing={isDrawing} onChange={updateSelection} />
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
