import type { ICloudRecordId } from './icloud-record-id.interface';

export interface ICloudFetchedDeletion extends ICloudRecordId {
    readonly recordType: string;
}
