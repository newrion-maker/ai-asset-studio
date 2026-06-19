import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import type { DownloadFormat } from '../../types';
import { downloadImage, generateFilename } from '../../utils/imageUtils';

export const DownloadButton = () => {
  const [format, setFormat] = useState<DownloadFormat>('png');
  const result = useAppStore((state) => state.generateResult);
  const outputMode = useAppStore((state) => state.outputMode);
  const isJpgDisabled = outputMode === 'transparent';

  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-2">
      <select
        className="min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
        value={format}
        onChange={(event) => setFormat(event.target.value as DownloadFormat)}
      >
        <option value="png">PNG</option>
        <option value="webp">WEBP</option>
        <option value="jpg" disabled={isJpgDisabled}>
          JPG
        </option>
      </select>
      <button
        type="button"
        className="btn-secondary min-w-0 justify-center"
        disabled={!result}
        onClick={() => {
          if (result) {
            void downloadImage(result.resultImageBase64, generateFilename(), format);
          }
        }}
      >
        Download
      </button>
    </div>
  );
};
