import OpenAI, { toFile } from 'openai';
import { isAuthenticated } from './_auth';

type OutputMode = 'keep_background' | 'transparent' | 'smart_auto' | 'eraser';
type PresetStyle = 'original' | 'flat' | 'clay' | '3d' | 'glass' | 'minimal' | 'gradient' | 'illustration' | 'isometric' | 'cartoon' | 'pictogram';
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
  apiKey?: string;
}

const maskInstruction =
  'A mask is provided. Only modify the fully transparent regions of the mask; keep the opaque (masked) subject pixels unchanged. Make the modified regions a clean, fully transparent background.';

const eraserMaskInstruction =
  'A mask marks a region to edit. Completely remove whatever is inside the masked (transparent) region and realistically fill it in by extending the surrounding background, textures, colors, gradients, lighting, and patterns so the area looks natural and seamless, as if the removed content was never there. Keep every non-masked area exactly unchanged. Do not add any new objects, people, or text.';

const basePrompts: Record<OutputMode, string> = {
  transparent:
    'Keep every foreground subject and object in the image exactly as it is — do not delete, omit, merge, or shrink any of them, including small props. Remove only the background so it becomes fully transparent. Preserve original proportions, colors, and details. Generate a transparent PNG with clean soft edges. No text.',
  keep_background:
    'Keep the original composition. Preserve background. Preserve lighting. Preserve atmosphere. High quality. No text.',
  smart_auto:
    'Analyze the image. Choose the best output automatically. Preserve important visual elements. Maintain quality. No text.',
  eraser:
    'Remove the masked content and reconstruct the underlying background seamlessly. Keep everything else unchanged. High quality. No text.',
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
    'A highly detailed 3D render isometric view of the scene depicted in the input image. Isometric projection, precise 30-degree angles, no perspective, infinite focus. Clean and smooth 3D modeling style, high-resolution texture, studio lighting with soft shadows. The composition should maintain the relative placement of objects from the input image but arranged perfectly in an isometric grid. Isolated on a neutral white background for a clean diorama effect.',
  cartoon:
    'Create a fun cartoon-style asset. Use bold clean outlines, bright cheerful colors, simple exaggerated shapes, smooth flat shading with soft highlights, and a playful friendly character look.',
  pictogram:
    'Create a simple pictogram-style icon. Use a single solid color silhouette, highly simplified universal symbol shapes, strong clear negative space, no gradients or fine detail, and a clean sign-system look.',
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

  const presetPrompt =
    outputMode === 'transparent'
      ? presetPrompts[selectedPreset].replace(
          /Isolated on a neutral white background for a clean diorama effect\.?/i,
          'Place the subject on a fully transparent background with no backdrop.',
        )
      : presetPrompts[selectedPreset];

  return [
    basePrompts[outputMode],
    presetPrompt,
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
    const body = readBody(req.body);
    const {
      croppedImageBase64,
      maskBase64,
      prompt = '',
      outputMode = 'smart_auto',
      selectedPreset = 'original',
      generationSettings = { aspectRatio: 'keep_selection', sizePreset: 'standard', fitMode: 'auto' },
      apiKey: userApiKey,
    } = body;

    // Each user supplies their own OpenAI key from the browser. It is used for
    // this request only and never stored or logged.
    const apiKey = userApiKey?.trim();
    if (!apiKey) {
      res.status(400).json({ error: 'no_api_key', message: 'An OpenAI API key is required.' });
      return;
    }

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
      prompt: maskFile
        ? `${basePrompt} ${outputMode === 'eraser' ? eraserMaskInstruction : maskInstruction}`
        : basePrompt,
      n: 1,
      size: chooseOpenAIImageSize(generationSettings),
      quality: 'medium',
      ...(outputMode === 'transparent' ? { background: 'transparent' } : {}),
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
    const status = (error as { status?: number })?.status;
    if (status === 401 || /incorrect api key|invalid api key/i.test(message)) {
      res.status(401).json({ error: 'invalid_api_key', message: 'The provided OpenAI API key is invalid.' });
      return;
    }
    res.status(502).json({ error: 'api_error', message });
  }
}
