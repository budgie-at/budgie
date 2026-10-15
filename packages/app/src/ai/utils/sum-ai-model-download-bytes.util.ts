import type { AiModelDownloadBytesInterface } from '../interface/ai-model-download-bytes.interface';
import type { AiModelDownloadProgressInterface } from '../interface/ai-model-download-progress.interface';

export const sumAiModelDownloadBytes = (models: readonly AiModelDownloadProgressInterface[]): AiModelDownloadBytesInterface =>
    models.reduce<AiModelDownloadBytesInterface>(
        (sum, model) => ({
            downloadedBytes: sum.downloadedBytes + (model.isComplete ? model.totalBytes : Math.min(model.bytesWritten, model.totalBytes)),
            totalBytes: sum.totalBytes + model.totalBytes
        }),
        { downloadedBytes: 0, totalBytes: 0 }
    );
