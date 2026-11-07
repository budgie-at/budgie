import type { ICloudFailure } from '../interface/icloud-failure.interface';
import type { ICloudZoneId } from '../interface/icloud-zone-id.interface';

export type ICloudFailedZone = ICloudZoneId & ICloudFailure;
