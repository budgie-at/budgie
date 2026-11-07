import { ICloudAccountChangeType } from '../enum/icloud-account-change-type.enum';

import type { ICloudBatchEvent } from './icloud-batch-event.interface';

export interface ICloudAccountChangeEvent extends ICloudBatchEvent {
    readonly changeType: ICloudAccountChangeType;
    readonly currentUserRecordName: string | null;
    readonly previousUserRecordName: string | null;
}
