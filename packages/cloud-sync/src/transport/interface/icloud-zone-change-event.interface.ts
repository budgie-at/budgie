import type { ICloudBatchEvent } from './icloud-batch-event.interface';
import type { ICloudDeletedZone } from './icloud-deleted-zone.interface';
import type { ICloudZoneId } from './icloud-zone-id.interface';

export interface ICloudZoneChangeEvent extends ICloudBatchEvent {
    readonly deleted: readonly ICloudDeletedZone[];
    readonly modified: readonly ICloudZoneId[];
}
