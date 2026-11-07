import type { ICloudFailedDelete } from '../type/icloud-failed-delete.type';
import type { ICloudFailedZone } from '../type/icloud-failed-zone.type';
import type { ICloudBatchEvent } from './icloud-batch-event.interface';
import type { ICloudFailedSave } from './icloud-failed-save.interface';
import type { ICloudRecordId } from './icloud-record-id.interface';
import type { ICloudSavedRecord } from './icloud-saved-record.interface';
import type { ICloudZoneId } from './icloud-zone-id.interface';

export interface ICloudSentChangesEvent extends ICloudBatchEvent {
    readonly savedRecords: readonly ICloudSavedRecord[];
    readonly failedSaves: readonly ICloudFailedSave[];
    readonly deletedRecords: readonly ICloudRecordId[];
    readonly failedDeletes: readonly ICloudFailedDelete[];
    readonly savedZones: readonly ICloudZoneId[];
    readonly failedZoneSaves: readonly ICloudFailedZone[];
    readonly deletedZones: readonly ICloudZoneId[];
    readonly failedZoneDeletes: readonly ICloudFailedZone[];
}
