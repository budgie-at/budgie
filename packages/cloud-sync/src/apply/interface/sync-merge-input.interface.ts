import type { SyncCellType } from '../type/sync-cell.type';
import type { SyncAuthorshipColumnInterface } from './sync-authorship-column.interface';

export interface SyncMergeInputInterface {
    readonly local: Readonly<Record<string, SyncCellType>>;
    readonly base: Readonly<Record<string, SyncCellType>> | null;
    readonly server: Readonly<Record<string, SyncCellType>>;
    readonly localChanged: ReadonlySet<string> | null;
    readonly authorship: SyncAuthorshipColumnInterface | null;
}
