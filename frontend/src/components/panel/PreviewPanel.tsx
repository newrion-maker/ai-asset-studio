import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import type { ImagePlacement } from '../../types';
import { cropImage } from '../../utils/imageUtils';

type PreviewBackground = 'white' | 'gray' | 'black' | 'checker';

const backgrounds: PreviewBackground[] = ['white', 'gray', 'black', 'checker'];

export const PreviewPanel = ({ placement }: { placement: ImagePlacement | null }) => {
  const uploadedImageDataUrl = useAppStore((state) => state.uploadedImageDataUrl);
  const selection = useAppStore((state) => state.selection);
  const [liveCrop, setLiveCrop] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!uploadedImageDataUrl || !selection || !placement || selection.width < 6 || selection.height < 6) {
      setLiveCrop(null);
      return;
    }

    void cropImage(uploadedImageDataUrl, selection, placement)
      .then((crop) => {
        if (!cancelled) {
          setLiveCrop(crop);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLiveCrop(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [placement, selection, uploadedImageDataUrl]);

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Selected Crop</h2>
      <PreviewSlot label="Select an area to preview the exact crop" src={liveCrop ?? undefined} backgroundClass="bg-slate-100 dark:bg-gray-950" />
    </section>
  );
};

const PreviewSlot = ({ label, src, backgroundClass }: { label: string; src?: string; backgroundClass: string }) => (
  <div className={`flex aspect-[4/3] flex-col items-center justify-center overflow-hidden rounded-xl border border-gray-200 ${backgroundClass} dark:border-gray-700`}>
    {src ? <img src={src} alt={label} className="h-full w-full object-contain" /> : <span className="px-2 text-center text-xs text-slate-500">{label}</span>}
  </div>
);
