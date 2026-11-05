import type { SyncRecordTypeEnum } from '../enum/sync-record-type.enum';
import type { SyncWireValueType } from '../type/sync-wire-value.type';

export interface SyncRecordInterface {
    readonly recordType: SyncRecordTypeEnum;
    readonly recordName: string;
    readonly zone: string;
    readonly schemaVersion: number;
    readonly encryptedFields: Readonly<Record<string, SyncWireValueType>>;
}
