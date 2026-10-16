import { isPositiveNumber } from '@rnw-community/shared';

import type { AiModelDownloadBytesInterface } from '../interface/ai-model-download-bytes.interface';
import type { AiModelDownloadProgressInterface } from '../interface/ai-model-download-progress.interface';

export const sumAiModelDownloadBytes = (models: readonly AiModelDownloadProgressInterface[]): AiModelDownloadBytesInterface => {
    const downloadedBytes = models.reduce(
        (sum, model) => sum + (model.isComplete ? model.totalBytes : Math.min(model.bytesWritten, model.totalBytes)),
        0
    );
    const totalBytes = models.reduce((sum, model) => sum + model.totalBytes, 0);

    return { downloadedBytes, totalBytes, ratio: isPositiveNumber(totalBytes) ? downloadedBytes / totalBytes : 0 };
};
