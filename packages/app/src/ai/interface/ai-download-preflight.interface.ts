import { NetworkTypeEnum } from '../../@generic/enum/network-type.enum';
import { AiModelDownloadStatusEnum } from '../enum/ai-model-download-status.enum';

export interface AiDownloadPreflightInterface {
    readonly status: AiModelDownloadStatusEnum;
    readonly totalBytes: number;
    readonly remainingBytes: number;
    readonly networkType: NetworkTypeEnum;
    readonly freeDiskBytes: number;
    readonly missingBytes: number;
    readonly hasEnoughSpace: boolean;
}
