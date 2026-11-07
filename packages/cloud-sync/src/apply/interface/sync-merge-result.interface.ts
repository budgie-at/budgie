import type { SyncCellType } from '../type/sync-cell.type';

export interface SyncMergeResultInterface {
    readonly merged: Readonly<Record<string, SyncCellType>>;
    readonly keptLocal: readonly string[];
}
