import { useEffect, useRef } from 'react';
import { Circle, Line, Rect, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { Point, SelectionMode, SelectionRect } from '../../types';

interface SelectionLayerProps {
  selectionMode: SelectionMode;
  selection: SelectionRect | null;
  isDrawing: boolean;
  onChange: (rect: SelectionRect) => void;
  polygon: Point[] | null;
  polygonClosed: boolean;
  polygonCursor: Point | null;
  onVertexMove: (index: number, point: Point) => void;
}

const STROKE = '#4F6EF7';
const FILL = 'rgba(79, 110, 247, 0.12)';

export const SelectionLayer = ({
  selectionMode,
  selection,
  isDrawing,
  onChange,
  polygon,
  polygonClosed,
  polygonCursor,
  onVertexMove,
}: SelectionLayerProps) => {
  const rectRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (selectionMode === 'rectangle' && rectRef.current && transformerRef.current && selection && !isDrawing) {
      transformerRef.current.nodes([rectRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isDrawing, selection, selectionMode]);

  if (selectionMode === 'polygon') {
    if (!polygon || polygon.length === 0) {
      return null;
    }

    const flat = polygon.flatMap((point) => [point.x, point.y]);
    const linePoints = polygonClosed || !polygonCursor ? flat : [...flat, polygonCursor.x, polygonCursor.y];

    return (
      <>
        <Line
          points={linePoints}
          stroke={STROKE}
          strokeWidth={2}
          closed={polygonClosed}
          fill={polygonClosed ? FILL : undefined}
          dash={polygonClosed ? undefined : [6, 4]}
          listening={false}
        />
        {polygon.map((point, index) => (
          <Circle
            key={index}
            x={point.x}
            y={point.y}
            radius={index === 0 && !polygonClosed && polygon.length >= 3 ? 7 : 5}
            fill={index === 0 && !polygonClosed && polygon.length >= 3 ? '#22c55e' : '#ffffff'}
            stroke={STROKE}
            strokeWidth={2}
            draggable
            onDragMove={(event) => onVertexMove(index, { x: event.target.x(), y: event.target.y() })}
            onDragEnd={(event) => onVertexMove(index, { x: event.target.x(), y: event.target.y() })}
          />
        ))}
      </>
    );
  }

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
        stroke={STROKE}
        strokeWidth={2}
        fill={FILL}
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
