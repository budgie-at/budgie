import type { DecodedSyncRecordInterface } from '../../mapping/interface/decoded-sync-record.interface';
import type { SyncApplyItemInterface } from './sync-apply-item.interface';

export interface SyncApplyUnitInterface {
    readonly incoming: readonly SyncApplyItemInterface[];
    readonly sources: readonly SyncApplyItemInterface[];
    readonly decoded: DecodedSyncRecordInterface;
    readonly movedTo: string | null;
}
