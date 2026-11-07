import type { ICloudRecordId } from './icloud-record-id.interface';

export interface ICloudSavedRecord extends ICloudRecordId {
    readonly recordType: string;
    readonly systemFields: string;
}
