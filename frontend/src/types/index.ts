export type Language = 'ko' | 'en';

export type OutputMode = 'keep_background' | 'transparent' | 'smart_auto' | 'remove_text';

export type PresetStyle =
  | 'original'
  | 'flat'
  | 'clay'
  | '3d'
  | 'glass'
  | 'minimal'
  | 'gradient'
  | 'illustration'
  | 'isometric'
  | 'cartoon'
  | 'pictogram';

export type DownloadFormat = 'png' | 'webp' | 'jpg';

export type ResultAspectRatio = 'keep_selection' | '1:1' | '4:3' | '16:9' | '2:1';

export type ResultSizePreset = 'tiny' | 'small' | 'preview' | 'standard' | 'large';

export type FitMode = 'auto' | 'contain' | 'cover';

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export type SelectionMode = 'rectangle' | 'polygon';

export interface ImagePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface EnhanceOptions {
  resolution: 1024 | 2048 | 4096;
  edgeImprove: boolean;
  shadowImprove: boolean;
  lightingImprove: boolean;
  colorImprove: boolean;
  keepAspectRatio: boolean;
}

export interface GenerationSettings {
  aspectRatio: ResultAspectRatio;
  sizePreset: ResultSizePreset;
  fitMode: FitMode;
  selectionAspectRatio?: number;
}

export interface GenerateRequest {
  croppedImageBase64: string;
  maskBase64?: string;
  prompt: string;
  outputMode: OutputMode;
  selectedPreset: PresetStyle;
  generationSettings: GenerationSettings;
  enhance?: EnhanceOptions;
  apiKey?: string;
}

export interface GenerateResult {
  resultImageBase64: string;
  originalCropBase64: string;
}

export interface AssetItem {
  id: string;
  name: string;
  previewBase64: string;
  date: string;
  resolution: string;
  prompt: string;
  style: PresetStyle;
  outputMode: OutputMode;
  aspectRatio?: ResultAspectRatio;
  sizePreset?: ResultSizePreset;
  favorite: boolean;
  tags: string[];
}

export type HistoryItem = AssetItem;

export type LoadingState = 'idle' | 'uploading' | 'generating' | 'processing' | 'complete';

export type ErrorType =
  | 'unsupported_file'
  | 'file_too_large'
  | 'no_selection'
  | 'no_api_key'
  | 'invalid_api_key'
  | 'config_error'
  | 'billing_limit'
  | 'api_error'
  | 'timeout'
  | 'network_error';
