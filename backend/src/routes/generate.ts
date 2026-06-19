import { Router } from 'express';
import type { GenerationSettings, OutputMode, PresetStyle } from '../services/openaiService.js';
import { buildPrompt, generateAsset } from '../services/openaiService.js';

interface GenerateBody {
  croppedImageBase64?: string;
  prompt?: string;
  outputMode?: OutputMode;
  selectedPreset?: PresetStyle;
  generationSettings?: GenerationSettings;
}

export const generateRouter = Router();

generateRouter.post('/generate', async (req, res, next) => {
  try {
    const {
      croppedImageBase64,
      prompt = '',
      outputMode = 'smart_auto',
      selectedPreset = 'original',
      generationSettings = { aspectRatio: 'keep_selection', sizePreset: 'standard', fitMode: 'auto' },
    } = req.body as GenerateBody;

    if (!croppedImageBase64) {
      res.status(400).json({ error: 'no_selection', message: 'croppedImageBase64 is required.' });
      return;
    }

    const fullPrompt = buildPrompt(prompt, outputMode, selectedPreset);
    const imageBuffer = Buffer.from(stripDataUrlPrefix(croppedImageBase64), 'base64');
    const result = await generateAsset({ imageBuffer, prompt: fullPrompt, generationSettings });

    res.json({
      resultImageBase64: `data:image/png;base64,${result.imageBase64}`,
      originalCropBase64: croppedImageBase64.startsWith('data:')
        ? croppedImageBase64
        : `data:image/png;base64,${croppedImageBase64}`,
    });
  } catch (error) {
    next(error);
  }
});

const stripDataUrlPrefix = (value: string): string => value.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
