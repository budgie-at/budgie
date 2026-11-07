import type { SyncRowReferenceInterface } from '../../mapping/interface/sync-row-reference.interface';
import type { SyncApplyItemInterface } from './sync-apply-item.interface';

export interface SyncHeldItemInterface {
    readonly item: SyncApplyItemInterface;
    readonly missing: SyncRowReferenceInterface;
}
