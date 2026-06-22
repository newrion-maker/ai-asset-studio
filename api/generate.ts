import OpenAI, { toFile } from 'openai';
import { isAuthenticated } from './_auth';

type OutputMode = 'keep_background' | 'transparent' | 'smart_auto';
type PresetStyle = 'original' | 'flat' | 'clay' | '3d' | 'glass' | 'minimal' | 'gradient' | 'illustration' | 'isometric';
type ResultAspectRatio = 'keep_selection' | '1:1' | '4:3' | '16:9' | '2:1';

interface GenerationSettings {
  aspectRatio: ResultAspectRatio;
  sizePreset: 'tiny' | 'small' | 'preview' | 'standard' | 'large';
  fitMode: 'auto' | 'contain' | 'cover';
  selectionAspectRatio?: number;
}

interface GenerateBody {
  croppedImageBase64?: string;
  maskBase64?: string;
  prompt?: string;
  outputMode?: OutputMode;
  selectedPreset?: PresetStyle;
  generationSettings?: GenerationSettings;
}

const maskInstruction =
  'A mask is provided. Only modify the fully transparent regions of the mask; keep the opaque (masked) subject pixels unchanged. Make the modified regions a clean, fully transparent background.';

const basePrompts: Record<OutputMode, string> = {
  transparent:
    'Keep only the primary object. Remove every background. Generate a transparent PNG. Preserve original proportions. High quality. No text. Soft edges.',
  keep_background:
    'Keep the original composition. Preserve background. Preserve lighting. Preserve atmosphere. High quality. No text.',
  smart_auto:
    'Analyze the image. Choose the best output automatically. Preserve important visual elements. Maintain quality. No text.',
};

const presetPrompts: Record<PresetStyle, string> = {
  original:
    'Preserve the original visual language and subject. Improve clarity, edges, lighting, and polish only when helpful. Do not redesign the asset unless the user specifically asks.',
  flat:
    'Create a clean flat vector-style asset. Use simple geometric shapes, clear silhouettes, minimal details, soft rounded corners, balanced spacing, and modern app-friendly colors.',
  clay:
    'Create a soft clay-style 3D asset. Use rounded handmade forms, matte pastel material, soft studio lighting, gentle shadows, and a friendly tactile appearance.',
  '3d':
    'Create a polished 3D render-style asset. Use dimensional forms, clean bevels, realistic but soft lighting, subtle shadows, and a premium product-render feel.',
  glass:
    'Create a translucent glassmorphism-style asset. Use frosted glass, soft highlights, subtle refraction, delicate shadows, and a clean modern interface-friendly look.',
  minimal:
    'Create a minimal asset. Remove unnecessary detail, keep the core shape and meaning, use restrained colors, strong spacing, and a clear readable silhouette.',
  gradient:
    'Create a modern gradient illustration. Use smooth color transitions, clean layered shapes, soft highlights, and a vibrant digital design style without clutter.',
  illustration:
    'Create a warm editorial illustration. Use friendly simplified characters or objects when relevant, soft colors, clean shapes, balanced composition, and web-ready polish.',
  isometric:
    'Create an isometric asset. Use a consistent three-quarter isometric angle, clean geometric structure, balanced depth, soft shadows, and clear spatial organization.',
};

const commonQualityPrompt =
  'Preserve the main subject and the full selected composition. Do not crop out important visible parts. Do not add random text, labels, logos, watermarks, extra people, unrelated objects, or UI elements. Keep the result clean, high quality, and suitable for web or app design.';

const aspectValues: Record<Exclude<ResultAspectRatio, 'keep_selection'>, number> = {
  '1:1': 1,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  '2:1': 2,
};

const readBody = (body: unknown): GenerateBody => {
  if (typeof body === 'string') {
    return JSON.parse(body) as GenerateBody;
  }
  return (body ?? {}) as GenerateBody;
};

const stripDataUrlPrefix = (value: string): string => value.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');

const getTargetAspectRatio = (settings: GenerationSettings): number => {
  if (settings.aspectRatio === 'keep_selection') {
    return settings.selectionAspectRatio ?? 1;
  }
  return aspectValues[settings.aspectRatio];
};

const chooseOpenAIImageSize = (settings: GenerationSettings): '1024x1024' | '1536x1024' | '1024x1536' => {
  const ratio = getTargetAspectRatio(settings);
  if (ratio > 1.12) {
    return '1536x1024';
  }
  if (ratio < 0.88) {
    return '1024x1536';
  }
  return '1024x1024';
};

const buildPrompt = (userPrompt: string, outputMode: OutputMode, selectedPreset: PresetStyle, settings: GenerationSettings): string => {
  const ratio = settings.aspectRatio === 'keep_selection' ? 'the same aspect ratio as the selected crop' : settings.aspectRatio;
  const fit =
    settings.fitMode === 'contain'
      ? 'Keep the entire subject visible; add natural surrounding background if needed.'
      : settings.fitMode === 'cover'
        ? 'Fill the whole frame with the subject and composition.'
        : 'Use the most natural framing for the selected crop.';

  return [
    basePrompts[outputMode],
    presetPrompts[selectedPreset],
    userPrompt.trim(),
    commonQualityPrompt,
    `Compose the result for a ${ratio} output. ${fit}`,
  ]
    .filter(Boolean)
    .join(' ');
};

export default async function handler(
  req: { method?: string; headers: { cookie?: string }; body?: unknown },
  res: { status: (code: number) => { json: (body: unknown) => void } },
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  if (!isAuthenticated(req.headers.cookie)) {
    res.status(401).json({ error: 'unauthorized', message: 'Password is required.' });
    return;
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required.');
    }

    const body = readBody(req.body);
    const {
      croppedImageBase64,
      maskBase64,
      prompt = '',
      outputMode = 'smart_auto',
      selectedPreset = 'original',
      generationSettings = { aspectRatio: 'keep_selection', sizePreset: 'standard', fitMode: 'auto' },
    } = body;

    if (!croppedImageBase64) {
      res.status(400).json({ error: 'no_selection', message: 'croppedImageBase64 is required.' });
      return;
    }

    const openai = new OpenAI({ apiKey });
    const imageBuffer = Buffer.from(stripDataUrlPrefix(croppedImageBase64), 'base64');
    const imageFile = await toFile(imageBuffer, 'crop.png', { type: 'image/png' });
    const maskFile = maskBase64
      ? await toFile(Buffer.from(stripDataUrlPrefix(maskBase64), 'base64'), 'mask.png', { type: 'image/png' })
      : undefined;
    const basePrompt = buildPrompt(prompt, outputMode, selectedPreset, generationSettings);
    const response = await openai.images.edit({
      model: process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1',
      image: imageFile,
      ...(maskFile ? { mask: maskFile } : {}),
      prompt: maskFile ? `${basePrompt} ${maskInstruction}` : basePrompt,
      n: 1,
      size: chooseOpenAIImageSize(generationSettings),
      stream: false,
    });

    const imageBase64 = response.data?.[0]?.b64_json;
    if (!imageBase64) {
      throw new Error('OpenAI image response did not include b64_json.');
    }

    res.status(200).json({
      resultImageBase64: `data:image/png;base64,${imageBase64}`,
      originalCropBase64: croppedImageBase64.startsWith('data:')
        ? croppedImageBase64
        : `data:image/png;base64,${croppedImageBase64}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isConfigError = message.includes('OPENAI_API_KEY');
    res.status(isConfigError ? 500 : 502).json({
      error: isConfigError ? 'config_error' : 'api_error',
      message,
    });
  }
}
