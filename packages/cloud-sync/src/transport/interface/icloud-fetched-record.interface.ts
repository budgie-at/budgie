import type { ICloudWireValue } from '../type/icloud-wire-value.type';
import type { ICloudRecordId } from './icloud-record-id.interface';

export interface ICloudFetchedRecord extends ICloudRecordId {
    readonly recordType: string;
    readonly systemFields: string;
    readonly schemaVersion: number;
    readonly encryptedFields: Readonly<Record<string, ICloudWireValue>>;
}
