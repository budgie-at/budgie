import type { ICloudFailure } from './icloud-failure.interface';
import type { ICloudFetchedRecord } from './icloud-fetched-record.interface';
import type { ICloudRecordId } from './icloud-record-id.interface';

export interface ICloudFailedSave extends ICloudRecordId, ICloudFailure {
    readonly recordType: string;
    readonly serverRecord: ICloudFetchedRecord | null;
}
