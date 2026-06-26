import { useCallback, useMemo } from 'react';
import { apiGenerate } from '../services/api';
import { useAppStore } from '../store/appStore';
import type { ImagePlacement } from '../types';
import {
  buildErasePayload,
  compositeErase,
  cropImage,
  cropImagePolygon,
  createPolygonMask,
  postProcessGeneratedImage,
} from '../utils/imageUtils';

export const useGenerate = (placement: ImagePlacement | null) => {
  const uploadedImageDataUrl = useAppStore((state) => state.uploadedImageDataUrl);
  const selection = useAppStore((state) => state.selection);
  const selectionMode = useAppStore((state) => state.selectionMode);
  const polygon = useAppStore((state) => state.polygon);
  const polygonClosed = useAppStore((state) => state.polygonClosed);
  const prompt = useAppStore((state) => state.prompt);
  const outputMode = useAppStore((state) => state.outputMode);
  const generationSettings = useAppStore((state) => state.generationSettings);
  const selectedPreset = useAppStore((state) => state.selectedPreset);
  const apiKey = useAppStore((state) => state.apiKey);
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
    if (!apiKey) {
      setError('no_api_key');
      return;
    }

    setLoadingState('generating');
    setError(null);
    try {
      const usePolygon = selectionMode === 'polygon' && polygonClosed && polygon && polygon.length >= 3;

      // Eraser: send the whole image plus a mask of the selected region, then
      // composite only that region back onto the full-resolution original.
      if (outputMode === 'eraser') {
        const erasePolygon = usePolygon ? polygon : null;
        const { imageBase64, maskBase64: eraseMask, width, height } = await buildErasePayload(
          uploadedImageDataUrl,
          selection,
          erasePolygon,
          placement,
        );
        const eraseResult = await apiGenerate({
          croppedImageBase64: imageBase64,
          maskBase64: eraseMask,
          prompt,
          outputMode: 'eraser',
          selectedPreset,
          generationSettings: { ...generationSettings, aspectRatio: 'keep_selection', selectionAspectRatio: width / height },
          apiKey,
        });
        const composited = await compositeErase(
          uploadedImageDataUrl,
          eraseResult.resultImageBase64,
          selection,
          erasePolygon,
          placement,
        );
        setGenerateResult({ resultImageBase64: composited, originalCropBase64: uploadedImageDataUrl });
        setLoadingState('complete');
        window.setTimeout(() => setLoadingState('idle'), 1500);
        return;
      }

      const originalCropBase64 = await cropImage(uploadedImageDataUrl, selection, placement);
      // The polygon mask is only for transparent extraction (keep inside, clear outside).
      const maskBase64 =
        usePolygon && outputMode === 'transparent'
          ? await createPolygonMask(uploadedImageDataUrl, polygon, placement)
          : undefined;
      const selectionAspectRatio = selection.width / selection.height;
      const result = await apiGenerate({
        croppedImageBase64: originalCropBase64,
        maskBase64,
        prompt,
        outputMode,
        selectedPreset,
        generationSettings: { ...generationSettings, selectionAspectRatio },
        apiKey,
      });
      const processedResult = await postProcessGeneratedImage(
        result.resultImageBase64,
        generationSettings,
        selectionAspectRatio,
        outputMode === 'transparent',
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
      } else if (message === 'no_api_key') {
        setError('no_api_key');
      } else if (message === 'invalid_api_key' || message.toLowerCase().includes('incorrect api key') || message.toLowerCase().includes('invalid api key')) {
        setError('invalid_api_key');
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
    apiKey,
    generationSettings,
    outputMode,
    placement,
    polygon,
    polygonClosed,
    prompt,
    selectedPreset,
    selection,
    selectionMode,
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
      const usePolygon = selectionMode === 'polygon' && polygonClosed && polygon && polygon.length >= 3;
      const originalCropBase64 = usePolygon
        ? await cropImagePolygon(uploadedImageDataUrl, polygon, placement)
        : await cropImage(uploadedImageDataUrl, selection, placement);
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
    polygon,
    polygonClosed,
    selection,
    selectionMode,
    setError,
    setGenerateResult,
    setLoadingState,
    uploadedImageDataUrl,
  ]);

  return { generate, cropOnly, canGenerate };
};
