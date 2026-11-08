import type { SyncWireValueType } from '../type/sync-wire-value.type';
import type { SyncRecordTypeEnum } from '@budgie/contracts';

export interface SyncRecordInterface {
    readonly recordType: SyncRecordTypeEnum;
    readonly recordName: string;
    readonly zone: string;
    readonly schemaVersion: number;
    readonly encryptedFields: Readonly<Record<string, SyncWireValueType>>;
}
