import OpenAI, { toFile } from 'openai';

export type OutputMode = 'keep_background' | 'transparent' | 'smart_auto' | 'eraser';
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
export type ResultAspectRatio = 'keep_selection' | '1:1' | '4:3' | '16:9' | '2:1';

export interface GenerationSettings {
  aspectRatio: ResultAspectRatio;
  sizePreset: 'tiny' | 'small' | 'preview' | 'standard' | 'large';
  fitMode: 'auto' | 'contain' | 'cover';
  selectionAspectRatio?: number;
}

interface GenerateAssetInput {
  imageBuffer: Buffer;
  maskBuffer?: Buffer;
  prompt: string;
  generationSettings: GenerationSettings;
  transparent?: boolean;
  eraser?: boolean;
  apiKey: string;
}

const maskInstruction =
  'A mask is provided. Only modify the fully transparent regions of the mask; keep the opaque (masked) subject pixels unchanged. Make the modified regions a clean, fully transparent background.';

const eraserMaskInstruction =
  'A mask marks a region to edit. Completely remove whatever is inside the masked (transparent) region and realistically fill it in by extending the surrounding background, textures, colors, gradients, lighting, and patterns so the area looks natural and seamless, as if the removed content was never there. Keep every non-masked area exactly unchanged. Do not add any new objects, people, or text.';

interface GenerateAssetResult {
  imageBase64: string;
}

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

export const buildPrompt = (userPrompt: string, outputMode: OutputMode, selectedPreset: PresetStyle): string => {
  const presetPrompt =
    outputMode === 'transparent'
      ? presetPrompts[selectedPreset].replace(
          /Isolated on a neutral white background for a clean diorama effect\.?/i,
          'Place the subject on a fully transparent background with no backdrop.',
        )
      : presetPrompts[selectedPreset];
  return [basePrompts[outputMode], presetPrompt, userPrompt.trim(), commonQualityPrompt].filter(Boolean).join(' ');
};

export const generateAsset = async ({
  imageBuffer,
  maskBuffer,
  prompt,
  generationSettings,
  transparent,
  eraser,
  apiKey,
}: GenerateAssetInput): Promise<GenerateAssetResult> => {
  const openai = new OpenAI({ apiKey });
  const imageFile = await toFile(imageBuffer, 'crop.png', { type: 'image/png' });
  const maskFile = maskBuffer ? await toFile(maskBuffer, 'mask.png', { type: 'image/png' }) : undefined;
  const model = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1';
  const aspectPrompt = buildAspectPrompt(prompt, generationSettings);
  const response = await openai.images.edit({
    model,
    image: imageFile,
    ...(maskFile ? { mask: maskFile } : {}),
    prompt: maskFile ? `${aspectPrompt} ${eraser ? eraserMaskInstruction : maskInstruction}` : aspectPrompt,
    n: 1,
    size: chooseOpenAIImageSize(generationSettings),
    quality: 'medium',
    ...(transparent ? { background: 'transparent' } : {}),
    stream: false,
  });

  const imageBase64 = response.data?.[0]?.b64_json;
  if (!imageBase64) {
    throw new Error('OpenAI image response did not include b64_json.');
  }

  return { imageBase64 };
};

const aspectValues: Record<Exclude<ResultAspectRatio, 'keep_selection'>, number> = {
  '1:1': 1,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  '2:1': 2,
};

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

const buildAspectPrompt = (prompt: string, settings: GenerationSettings): string => {
  const ratio = settings.aspectRatio === 'keep_selection' ? 'the same aspect ratio as the selected crop' : settings.aspectRatio;
  const fit =
    settings.fitMode === 'contain'
      ? 'Keep the entire subject visible; add natural surrounding background if needed.'
      : settings.fitMode === 'cover'
        ? 'Fill the whole frame with the subject and composition.'
        : 'Use the most natural framing for the selected crop.';
  return `${prompt} Compose the result for a ${ratio} output. ${fit}`;
};
