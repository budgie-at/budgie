import { AiModelDownloadStatusEnum } from '../enum/ai-model-download-status.enum';

export interface AiModelDownloadSummaryInterface {
    readonly status: AiModelDownloadStatusEnum;
    readonly downloadedBytes: number;
    readonly totalBytes: number;
    readonly remainingBytes: number;
    readonly percent: number;
    readonly etaSeconds: number | null;
    readonly missingBytes: number;
    readonly freeBytes: number;
    readonly isMobileDataAllowed: boolean;
    readonly isNoticeDismissed: boolean;
}
