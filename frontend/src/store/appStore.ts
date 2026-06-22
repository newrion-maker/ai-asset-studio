import { create } from 'zustand';
import type {
  AssetItem,
  EnhanceOptions,
  ErrorType,
  GenerateResult,
  GenerationSettings,
  HistoryItem,
  LoadingState,
  OutputMode,
  Point,
  PresetStyle,
  SelectionMode,
  SelectionRect,
} from '../types';

interface AppState {
  uploadedImage: HTMLImageElement | null;
  uploadedImageDataUrl: string | null;
  selection: SelectionRect | null;
  selectionMode: SelectionMode;
  polygon: Point[] | null;
  polygonClosed: boolean;
  prompt: string;
  outputMode: OutputMode;
  generationSettings: GenerationSettings;
  selectedPreset: PresetStyle;
  enhanceOptions: EnhanceOptions;
  generateResult: GenerateResult | null;
  loadingState: LoadingState;
  error: ErrorType | null;
  errorDetail: string | null;
  assetLibrary: AssetItem[];
  history: HistoryItem[];
  darkMode: boolean;
  historyOpen: boolean;
  settingsOpen: boolean;
  setUploadedImage: (img: HTMLImageElement, dataUrl: string) => void;
  clearUploadedImage: () => void;
  setSelection: (sel: SelectionRect | null) => void;
  setSelectionMode: (mode: SelectionMode) => void;
  setPolygon: (polygon: Point[] | null, closed?: boolean) => void;
  setPrompt: (prompt: string) => void;
  setOutputMode: (mode: OutputMode) => void;
  setGenerationSettings: (settings: Partial<GenerationSettings>) => void;
  setSelectedPreset: (preset: PresetStyle) => void;
  setGenerateResult: (result: GenerateResult | null) => void;
  setLoadingState: (state: LoadingState) => void;
  setError: (err: ErrorType | null, detail?: string | null) => void;
  addToHistory: (item: HistoryItem) => void;
  setAssetLibrary: (items: AssetItem[]) => void;
  saveAsset: (item: AssetItem) => void;
  deleteAsset: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleDarkMode: () => void;
  toggleHistory: () => void;
  setSettingsOpen: (open: boolean) => void;
}

const defaultEnhanceOptions: EnhanceOptions = {
  resolution: 1024,
  edgeImprove: false,
  shadowImprove: false,
  lightingImprove: false,
  colorImprove: false,
  keepAspectRatio: true,
};

const defaultGenerationSettings: GenerationSettings = {
  aspectRatio: 'keep_selection',
  sizePreset: 'standard',
  fitMode: 'auto',
};

export const useAppStore = create<AppState>((set) => ({
  uploadedImage: null,
  uploadedImageDataUrl: null,
  selection: null,
  selectionMode: 'rectangle',
  polygon: null,
  polygonClosed: false,
  prompt: '',
  outputMode: 'transparent',
  generationSettings: defaultGenerationSettings,
  selectedPreset: 'original',
  enhanceOptions: defaultEnhanceOptions,
  generateResult: null,
  loadingState: 'idle',
  error: null,
  errorDetail: null,
  assetLibrary: [],
  history: [],
  darkMode: window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false,
  historyOpen: true,
  settingsOpen: false,
  setUploadedImage: (img, dataUrl) =>
    set({
      uploadedImage: img,
      uploadedImageDataUrl: dataUrl,
      selection: null,
      polygon: null,
      polygonClosed: false,
      generateResult: null,
      error: null,
      errorDetail: null,
    }),
  clearUploadedImage: () =>
    set({
      uploadedImage: null,
      uploadedImageDataUrl: null,
      selection: null,
      polygon: null,
      polygonClosed: false,
      generateResult: null,
      loadingState: 'idle',
      error: null,
      errorDetail: null,
    }),
  setSelection: (selection) => set({ selection }),
  setSelectionMode: (selectionMode) =>
    set({ selectionMode, selection: null, polygon: null, polygonClosed: false }),
  setPolygon: (polygon, closed = false) => set({ polygon, polygonClosed: closed }),
  setPrompt: (prompt) => set({ prompt }),
  setOutputMode: (outputMode) => set({ outputMode }),
  setGenerationSettings: (settings) =>
    set((state) => ({ generationSettings: { ...state.generationSettings, ...settings } })),
  setSelectedPreset: (selectedPreset) => set({ selectedPreset }),
  setGenerateResult: (generateResult) => set({ generateResult }),
  setLoadingState: (loadingState) => set({ loadingState }),
  setError: (error, errorDetail = null) => set({ error, errorDetail }),
  addToHistory: (item) => set((state) => ({ history: [item, ...state.history].slice(0, 20) })),
  setAssetLibrary: (assetLibrary) => set({ assetLibrary }),
  saveAsset: (item) => set((state) => ({ assetLibrary: [item, ...state.assetLibrary] })),
  deleteAsset: (id) =>
    set((state) => ({
      assetLibrary: state.assetLibrary.filter((item) => item.id !== id),
      history: state.history.filter((item) => item.id !== id),
    })),
  toggleFavorite: (id) =>
    set((state) => ({
      assetLibrary: state.assetLibrary.map((item) =>
        item.id === id ? { ...item, favorite: !item.favorite } : item,
      ),
    })),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  toggleHistory: () => set((state) => ({ historyOpen: !state.historyOpen })),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
}));
