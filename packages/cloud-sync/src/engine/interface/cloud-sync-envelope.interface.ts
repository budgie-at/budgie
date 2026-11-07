import type { ICloudWireValue } from '../../transport/type/icloud-wire-value.type';

export interface CloudSyncEnvelopeInterface {
    readonly recordType: string;
    readonly recordName: string;
    readonly zone: string;
    readonly schemaVersion: number;
    readonly encryptedFields: Readonly<Record<string, ICloudWireValue>>;
}
