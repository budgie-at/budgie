import type { SyncCellType } from './sync-cell.type';

export type SyncBaseValuationGuardType = (
    local: Readonly<Record<string, SyncCellType>>,
    server: Readonly<Record<string, SyncCellType>>
) => Readonly<Record<string, SyncCellType>>;
