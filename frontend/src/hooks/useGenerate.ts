import { useCallback, useMemo } from 'react';
import { apiGenerate } from '../services/api';
import { useAppStore } from '../store/appStore';
import type { ImagePlacement } from '../types';
import { cropImage, postProcessGeneratedImage } from '../utils/imageUtils';

export const useGenerate = (placement: ImagePlacement | null) => {
  const uploadedImageDataUrl = useAppStore((state) => state.uploadedImageDataUrl);
  const selection = useAppStore((state) => state.selection);
  const prompt = useAppStore((state) => state.prompt);
  const outputMode = useAppStore((state) => state.outputMode);
  const generationSettings = useAppStore((state) => state.generationSettings);
  const selectedPreset = useAppStore((state) => state.selectedPreset);
  const setGenerateResult = useAppStore((state) => state.setGenerateResult);
  const setLoadingState = useAppStore((state) => state.setLoadingState);
  const setError = useAppStore((state) => state.setError);

  const canGenerate = useMemo(
    () => Boolean(uploadedImageDataUrl && selection && placement),
    [placement, selection, uploadedImageDataUrl],
  );

  const generate = useCallback(async () => {
    if (!uploadedImageDataUrl || !selection || !placement) {
      setError('no_selection');
      return;
    }

    setLoadingState('generating');
    setError(null);
    try {
      const originalCropBase64 = await cropImage(uploadedImageDataUrl, selection, placement);
      const selectionAspectRatio = selection.width / selection.height;
      const result = await apiGenerate({
        croppedImageBase64: originalCropBase64,
        prompt,
        outputMode,
        selectedPreset,
        generationSettings: { ...generationSettings, selectionAspectRatio },
      });
      const processedResult = await postProcessGeneratedImage(
        result.resultImageBase64,
        generationSettings,
        selectionAspectRatio,
      );
      const finalResult = { ...result, resultImageBase64: processedResult.base64 };
      setGenerateResult(finalResult);
      setLoadingState('complete');
      window.setTimeout(() => setLoadingState('idle'), 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message === 'timeout') {
        setError('timeout');
      } else if (message === 'network_error') {
        setError('network_error');
      } else if (message.includes('OPENAI_API_KEY') || message === 'config_error') {
        setError('config_error', message);
      } else if (message.toLowerCase().includes('billing hard limit') || message.toLowerCase().includes('billing')) {
        setError('billing_limit', message);
      } else {
        setError('api_error', message);
      }
      setLoadingState('idle');
    }
  }, [
    generationSettings,
    outputMode,
    placement,
    prompt,
    selectedPreset,
    selection,
    setError,
    setGenerateResult,
    setLoadingState,
    uploadedImageDataUrl,
  ]);

  const cropOnly = useCallback(async () => {
    if (!uploadedImageDataUrl || !selection || !placement) {
      setError('no_selection');
      return;
    }

    setLoadingState('processing');
    setError(null);
    try {
      const originalCropBase64 = await cropImage(uploadedImageDataUrl, selection, placement);
      const selectionAspectRatio = selection.width / selection.height;
      const processedResult = await postProcessGeneratedImage(
        originalCropBase64,
        { ...generationSettings, aspectRatio: 'keep_selection', fitMode: 'cover' },
        selectionAspectRatio,
      );
      const finalResult = {
        originalCropBase64,
        resultImageBase64: processedResult.base64,
      };
      setGenerateResult(finalResult);
      setLoadingState('complete');
      window.setTimeout(() => setLoadingState('idle'), 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setError('api_error', message);
      setLoadingState('idle');
    }
  }, [
    generationSettings,
    placement,
    selection,
    setError,
    setGenerateResult,
    setLoadingState,
    uploadedImageDataUrl,
  ]);

  return { generate, cropOnly, canGenerate };
};
