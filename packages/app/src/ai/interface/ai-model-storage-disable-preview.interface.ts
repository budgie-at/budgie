import { AiFeatureIdEnum } from '../enum/ai-feature-id.enum';

export interface AiModelStorageDisablePreviewInterface {
    readonly featureId: AiFeatureIdEnum;
    readonly reclaimableBytes: number;
    readonly keepsSharedDownloads: boolean;
}
