import { ICloudAccountChangeType } from '../enum/icloud-account-change-type.enum';

import type { ICloudScopedEvent } from './icloud-scoped-event.interface';

export interface ICloudAccountChangeEvent extends ICloudScopedEvent {
    readonly changeType: ICloudAccountChangeType;
    readonly currentUserRecordName: string | null;
    readonly previousUserRecordName: string | null;
}
