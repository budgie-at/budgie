import type { SyncRowValueType } from '../type/sync-row-value.type';
import type { SyncRowReferenceInterface } from './sync-row-reference.interface';

export interface DecodedSyncColumnInterface {
    readonly value: SyncRowValueType | null;
    readonly reference: SyncRowReferenceInterface | null;
}
