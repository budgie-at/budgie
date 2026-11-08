import type { SyncRowInterface } from './sync-row.interface';
import type { SyncRecordTypeEnum } from '@budgie/contracts';

export interface DecodedSyncRecordInterface {
    readonly recordType: SyncRecordTypeEnum;
    readonly recordName: string;
    readonly zone: string;
    readonly linkId: string | null;
    readonly legCount: number;
    readonly rows: readonly SyncRowInterface[];
    readonly legPrivateRows: readonly SyncRowInterface[];
}
