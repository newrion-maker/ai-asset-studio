import { useEffect, useRef } from 'react';
import { Rect, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { SelectionRect } from '../../types';

interface SelectionLayerProps {
  selection: SelectionRect | null;
  isDrawing: boolean;
  onChange: (rect: SelectionRect) => void;
}

export const SelectionLayer = ({ selection, isDrawing, onChange }: SelectionLayerProps) => {
  const rectRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (rectRef.current && transformerRef.current && selection && !isDrawing) {
      transformerRef.current.nodes([rectRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isDrawing, selection]);

  if (!selection) {
    return null;
  }

  return (
    <>
      <Rect
        ref={rectRef}
        x={selection.x}
        y={selection.y}
        width={selection.width}
        height={selection.height}
        stroke="#4F6EF7"
        strokeWidth={2}
        fill="rgba(79, 110, 247, 0.12)"
        draggable={!isDrawing}
        onDragEnd={(event) =>
          onChange({ x: event.target.x(), y: event.target.y(), width: selection.width, height: selection.height })
        }
        onTransformEnd={() => {
          const node = rectRef.current;
          if (!node) {
            return;
          }
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            width: Math.max(6, node.width() * scaleX),
            height: Math.max(6, node.height() * scaleY),
          });
        }}
      />
      {!isDrawing && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={false}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']}
          boundBoxFunc={(_, newBox) => (newBox.width < 6 || newBox.height < 6 ? _ : newBox)}
        />
      )}
    </>
  );
};
