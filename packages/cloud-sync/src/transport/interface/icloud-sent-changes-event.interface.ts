import type { ICloudFailedDelete } from '../type/icloud-failed-delete.type';
import type { ICloudFailedSave } from './icloud-failed-save.interface';
import type { ICloudRecordId } from './icloud-record-id.interface';
import type { ICloudSavedRecord } from './icloud-saved-record.interface';
import type { ICloudScopedEvent } from './icloud-scoped-event.interface';

export interface ICloudSentChangesEvent extends ICloudScopedEvent {
    readonly savedRecords: readonly ICloudSavedRecord[];
    readonly failedSaves: readonly ICloudFailedSave[];
    readonly deletedRecords: readonly ICloudRecordId[];
    readonly failedDeletes: readonly ICloudFailedDelete[];
}
