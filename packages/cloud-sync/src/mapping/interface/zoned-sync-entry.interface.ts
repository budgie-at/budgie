import type { SyncRowInputType } from '../type/sync-row-input.type';

export interface ZonedSyncEntryInterface {
    readonly entry: SyncRowInputType;
    readonly zone: string;
}
