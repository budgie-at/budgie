import { ICloudErrorCode } from '../enum/icloud-error-code.enum';
import { ICloudShareOutcome } from '../enum/icloud-share-outcome.enum';

import type { ICloudZoneId } from './icloud-zone-id.interface';

export interface ICloudShareAcceptedEvent extends ICloudZoneId {
    readonly outcome: ICloudShareOutcome;
    readonly ownerDisplayName?: string;
    readonly code?: ICloudErrorCode;
    readonly message?: string;
}
