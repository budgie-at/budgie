import type { SyncDerivedMergeInterface } from './sync-derived-merge.interface';
import type { SyncPausedZoneInterface } from './sync-paused-zone.interface';
import type { SyncRejectedRecordInterface } from './sync-rejected-record.interface';
import type { SyncReenqueuedRecordInterface } from './sync-reenqueued-record.interface';

export interface SyncApplyResultInterface {
    readonly touched: Readonly<Record<string, readonly string[]>>;
    readonly touchedRows: Readonly<Record<string, readonly string[]>>;
    readonly deleted: Readonly<Record<string, readonly string[]>>;
    readonly heldBack: number;
    readonly skipped: number;
    readonly rejected: readonly SyncRejectedRecordInterface[];
    readonly pausedZones: readonly SyncPausedZoneInterface[];
    readonly reenqueued: readonly SyncReenqueuedRecordInterface[];
    readonly merged: readonly SyncDerivedMergeInterface[];
}
