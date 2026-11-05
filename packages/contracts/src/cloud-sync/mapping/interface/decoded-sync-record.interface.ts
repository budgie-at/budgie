import type { SyncRecordTypeEnum } from '../enum/sync-record-type.enum';
import type { SyncRowInterface } from './sync-row.interface';

export interface DecodedSyncRecordInterface {
    readonly recordType: SyncRecordTypeEnum;
    readonly recordName: string;
    readonly zone: string;
    readonly linkId: string | null;
    readonly legCount: number;
    readonly rows: readonly SyncRowInterface[];
    readonly legPrivateRows: readonly SyncRowInterface[];
}
