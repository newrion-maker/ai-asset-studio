import type { DownloadFormat, GenerationSettings, ImagePlacement, Point, ResultAspectRatio, ResultSizePreset, SelectionRect } from '../types';

export const stripDataUrlPrefix = (value: string): string => value.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');

export const getImagePlacement = (
  image: HTMLImageElement,
  stageWidth: number,
  stageHeight: number,
): ImagePlacement => {
  const padding = 32;
  const availableWidth = Math.max(1, stageWidth - padding * 2);
  const availableHeight = Math.max(1, stageHeight - padding * 2);
  const fitScale = Math.min(availableWidth / image.naturalWidth, availableHeight / image.naturalHeight);
  const scale = Math.max(0.05, Math.min(fitScale, 4));
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;

  return {
    x: (stageWidth - width) / 2,
    y: Math.max(16, (stageHeight - height) / 2),
    width,
    height,
    scale,
  };
};

export const normalizeRect = (rect: SelectionRect): SelectionRect => ({
  x: rect.width < 0 ? rect.x + rect.width : rect.x,
  y: rect.height < 0 ? rect.y + rect.height : rect.y,
  width: Math.abs(rect.width),
  height: Math.abs(rect.height),
});

interface CropRect {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
  width: number;
  height: number;
}

// Longest-edge cap for the crop/mask sent to OpenAI. gpt-image-1 outputs at most
// 1024/1536px, so sending the full-resolution crop just bloats the request body
// (which fails on Vercel's request size limit). Capping keeps the payload small.
const MAX_UPLOAD_EDGE = 1024;

// Source rectangle (in natural image pixels) plus the rounded output canvas size.
// Shared by cropImage and the polygon mask/crop helpers so the crop and its mask
// always come out with identical dimensions (required by OpenAI images.edit).
const getCropRect = (img: HTMLImageElement, selection: SelectionRect, placement: ImagePlacement): CropRect => {
  const normalized = normalizeRect(selection);
  const sourceX = Math.max(0, (normalized.x - placement.x) / placement.scale);
  const sourceY = Math.max(0, (normalized.y - placement.y) / placement.scale);
  const sourceWidth = Math.min(img.naturalWidth - sourceX, normalized.width / placement.scale);
  const sourceHeight = Math.min(img.naturalHeight - sourceY, normalized.height / placement.scale);
  const downscale = Math.min(1, MAX_UPLOAD_EDGE / Math.max(sourceWidth, sourceHeight));
  return {
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    width: Math.max(1, Math.round(sourceWidth * downscale)),
    height: Math.max(1, Math.round(sourceHeight * downscale)),
  };
};

export const polygonBounds = (points: Point[]): SelectionRect => {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
};

// Trace the polygon onto a canvas context, mapping stage coordinates into the
// cropped canvas space (crop top-left = origin, scaled to the rounded size).
const tracePolygon = (
  context: CanvasRenderingContext2D,
  points: Point[],
  placement: ImagePlacement,
  crop: CropRect,
): void => {
  const scaleX = crop.width / crop.sourceWidth;
  const scaleY = crop.height / crop.sourceHeight;
  context.beginPath();
  points.forEach((point, index) => {
    const naturalX = (point.x - placement.x) / placement.scale;
    const naturalY = (point.y - placement.y) / placement.scale;
    const canvasX = (naturalX - crop.sourceX) * scaleX;
    const canvasY = (naturalY - crop.sourceY) * scaleY;
    if (index === 0) {
      context.moveTo(canvasX, canvasY);
    } else {
      context.lineTo(canvasX, canvasY);
    }
  });
  context.closePath();
};

export const cropImage = async (
  imageDataUrl: string,
  selection: SelectionRect,
  placement: ImagePlacement,
): Promise<string> => {
  const img = await loadImage(imageDataUrl);
  const crop = getCropRect(img, selection, placement);

  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not available.');
  }

  context.drawImage(img, crop.sourceX, crop.sourceY, crop.sourceWidth, crop.sourceHeight, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
};

// Alpha mask for OpenAI images.edit: inside the polygon stays opaque (kept),
// outside is transparent (the editable region the model removes/regenerates).
// Dimensions match cropImage's output for the same polygon bounds.
export const createPolygonMask = async (
  imageDataUrl: string,
  polygon: Point[],
  placement: ImagePlacement,
): Promise<string> => {
  const img = await loadImage(imageDataUrl);
  const bounds = polygonBounds(polygon);
  const crop = getCropRect(img, bounds, placement);

  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not available.');
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  tracePolygon(context, polygon, placement, crop);
  context.fillStyle = '#ffffff';
  context.fill();
  return canvas.toDataURL('image/png');
};

// Pixel-accurate polygon crop: keeps the original pixels inside the polygon and
// makes everything outside transparent. Used for "Crop Only" in polygon mode.
export const cropImagePolygon = async (
  imageDataUrl: string,
  polygon: Point[],
  placement: ImagePlacement,
): Promise<string> => {
  const img = await loadImage(imageDataUrl);
  const bounds = polygonBounds(polygon);
  const crop = getCropRect(img, bounds, placement);

  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not available.');
  }

  tracePolygon(context, polygon, placement, crop);
  context.clip();
  context.drawImage(img, crop.sourceX, crop.sourceY, crop.sourceWidth, crop.sourceHeight, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
};

export const getAspectRatioValue = (aspectRatio: ResultAspectRatio, fallback: number): number => {
  if (aspectRatio === 'keep_selection') {
    return fallback;
  }
  const [width, height] = aspectRatio.split(':').map(Number);
  return width / height;
};

export const getOutputDimensions = (
  aspectRatio: number,
  sizePreset: ResultSizePreset,
  sourceWidth: number,
  sourceHeight: number,
): { width: number; height: number } => {
  if (sizePreset === 'large') {
    return { width: sourceWidth, height: sourceHeight };
  }

  const sizeMap: Record<Exclude<ResultSizePreset, 'large'>, number> = {
    tiny: 128,
    small: 256,
    preview: 512,
    standard: 1024,
  };
  const longEdge = sizeMap[sizePreset];
  if (aspectRatio >= 1) {
    return { width: longEdge, height: Math.max(1, Math.round(longEdge / aspectRatio)) };
  }
  return { width: Math.max(1, Math.round(longEdge * aspectRatio)), height: longEdge };
};

export const postProcessGeneratedImage = async (
  base64: string,
  settings: GenerationSettings,
  selectionAspectRatio: number,
): Promise<{ base64: string; resolution: string }> => {
  const image = await loadImage(base64);
  const targetAspectRatio = getAspectRatioValue(settings.aspectRatio, selectionAspectRatio);
  const dimensions = getOutputDimensions(targetAspectRatio, settings.sizePreset, image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not available.');
  }

  const sourceAspectRatio = image.naturalWidth / image.naturalHeight;
  const shouldContain =
    settings.fitMode === 'contain' ||
    (settings.fitMode === 'auto' && Math.abs(sourceAspectRatio - targetAspectRatio) > 0.25);

  if (shouldContain) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  } else {
    const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
  }

  return {
    base64: canvas.toDataURL('image/png'),
    resolution: `${canvas.width}x${canvas.height}`,
  };
};

export const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(stripDataUrlPrefix(base64));
  const byteNumbers = Array.from(byteCharacters, (character) => character.charCodeAt(0));
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
};

export const downloadImage = async (base64: string, filename: string, format: DownloadFormat): Promise<void> => {
  const source = await loadImage(base64);
  const canvas = document.createElement('canvas');
  canvas.width = source.naturalWidth;
  canvas.height = source.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not available.');
  }

  if (format === 'jpg') {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(source, 0, 0);

  const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
  const dataUrl = canvas.toDataURL(mimeType, 0.94);
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = `${filename}.${format}`;
  anchor.click();
};

export const generateFilename = (): string => {
  const now = new Date();
  const pad = (value: number): string => value.toString().padStart(2, '0');
  return `asset-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(
    now.getMinutes(),
  )}${pad(now.getSeconds())}`;
};

export const loadImage = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image could not be loaded.'));
    image.src = dataUrl;
  });
