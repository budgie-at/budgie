import { AiFeatureIdEnum } from '../enum/ai-feature-id.enum';

export interface AiFeatureStorageInterface {
    readonly id: AiFeatureIdEnum;
    readonly isEnabled: boolean;
    readonly requiredBytes: number;
    readonly reclaimableBytesAfterDisable: number;
}
