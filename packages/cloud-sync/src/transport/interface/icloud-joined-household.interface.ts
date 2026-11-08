import type { ICloudZoneId } from './icloud-zone-id.interface';

export interface ICloudJoinedHousehold extends ICloudZoneId {
    readonly ownerDisplayName?: string;
}
