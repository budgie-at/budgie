import type { ICloudDeletedZone } from './icloud-deleted-zone.interface';
import type { ICloudScopedEvent } from './icloud-scoped-event.interface';
import type { ICloudZoneId } from './icloud-zone-id.interface';

export interface ICloudZoneChangeEvent extends ICloudScopedEvent {
    readonly deleted: readonly ICloudDeletedZone[];
    readonly modified: readonly ICloudZoneId[];
}
