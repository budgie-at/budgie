import { ICloudZoneChangeReason } from '../enum/icloud-zone-change-reason.enum';

import type { ICloudZoneId } from './icloud-zone-id.interface';

export interface ICloudDeletedZone extends ICloudZoneId {
    readonly reason: ICloudZoneChangeReason;
}
