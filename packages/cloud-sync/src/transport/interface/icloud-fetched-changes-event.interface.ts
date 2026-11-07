import type { ICloudScopedEvent } from './icloud-scoped-event.interface';
import type { ICloudFetchedDeletion } from './icloud-fetched-deletion.interface';
import type { ICloudFetchedRecord } from './icloud-fetched-record.interface';
import type { ICloudZoneId } from './icloud-zone-id.interface';

export interface ICloudFetchedChangesEvent extends ICloudScopedEvent {
    readonly records: readonly ICloudFetchedRecord[];
    readonly deletions: readonly ICloudFetchedDeletion[];
    readonly changedShares: readonly ICloudZoneId[];
}
