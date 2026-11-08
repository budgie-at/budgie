import type { ICloudWireValue } from '../type/icloud-wire-value.type';
import type { ICloudRecordId } from './icloud-record-id.interface';

export interface ICloudRecordPayload extends ICloudRecordId {
    readonly recordType: string;
    readonly systemFields: string | null;
    readonly schemaVersion: number;
    readonly encryptedFields: Readonly<Record<string, ICloudWireValue | null>>;
}
