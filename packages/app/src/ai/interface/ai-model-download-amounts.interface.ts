import type { AiModelDownloadSummaryInterface } from './ai-model-download-summary.interface';

export interface AiModelDownloadAmountsInterface {
    readonly summary: AiModelDownloadSummaryInterface;
    readonly downloaded: string;
    readonly total: string;
    readonly remaining: string;
    readonly missing: string;
    readonly free: string;
}
