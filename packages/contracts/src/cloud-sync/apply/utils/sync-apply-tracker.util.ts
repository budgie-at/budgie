import { isDefined, isEmptyArray } from '@rnw-community/shared';

import type { SyncApplyResultInterface } from '../interface/sync-apply-result.interface';
import type { SyncDerivedMergeInterface } from '../interface/sync-derived-merge.interface';
import type { SyncPausedZoneInterface } from '../interface/sync-paused-zone.interface';
import type { SyncReenqueuedRecordInterface } from '../interface/sync-reenqueued-record.interface';
import type { SyncRejectedRecordInterface } from '../interface/sync-rejected-record.interface';

export class SyncApplyTracker {
    private readonly touchedByType = new Map<string, Set<string>>();
    private readonly touchedByTable = new Map<string, Set<string>>();
    private readonly deletedByType = new Map<string, Set<string>>();
    private readonly accountIdSet = new Set<number>();
    private readonly outboxDecisions = new Map<string, SyncReenqueuedRecordInterface>();
    private readonly rejectedRecords: SyncRejectedRecordInterface[] = [];
    private skippedCount = 0;

    addTouched(recordType: string, syncId: string, touchedRows: ReadonlyArray<readonly [string, string]>): void {
        SyncApplyTracker.addTo(this.touchedByType, recordType, syncId);
        touchedRows.forEach(([tableName, rowSyncId]) => SyncApplyTracker.addTo(this.touchedByTable, tableName, rowSyncId));
    }

    addDeleted(recordType: string, syncId: string): void {
        SyncApplyTracker.addTo(this.deletedByType, recordType, syncId);
    }

    addAccountIds(accountIds: readonly number[]): void {
        accountIds.forEach(accountId => this.accountIdSet.add(accountId));
    }

    decideOutbox(decision: SyncReenqueuedRecordInterface): void {
        this.outboxDecisions.set(`${decision.syncZone}|${decision.syncId}`, decision);
    }

    reject(rejection: SyncRejectedRecordInterface): void {
        this.rejectedRecords.push(rejection);
    }

    skip(): void {
        this.skippedCount += 1;
    }

    get accountIds(): readonly number[] {
        return [...this.accountIdSet];
    }

    get pendingOutboxDecisions(): readonly SyncReenqueuedRecordInterface[] {
        return [...this.outboxDecisions.values()];
    }

    touchedSyncIds(recordType: string): readonly string[] {
        return [...(this.touchedByType.get(recordType) ?? [])];
    }

    toResult(
        heldBack: number,
        pausedZones: readonly SyncPausedZoneInterface[],
        merged: readonly SyncDerivedMergeInterface[]
    ): SyncApplyResultInterface {
        return {
            touched: SyncApplyTracker.toRecord(this.touchedByType),
            touchedRows: SyncApplyTracker.toRecord(this.touchedByTable),
            deleted: SyncApplyTracker.toRecord(this.deletedByType),
            heldBack,
            skipped: this.skippedCount,
            rejected: this.rejectedRecords,
            pausedZones,
            reenqueued: this.pendingOutboxDecisions.filter(({ changedColumns }) => !isEmptyArray(changedColumns)),
            merged
        };
    }

    private static addTo(target: Map<string, Set<string>>, key: string, value: string): void {
        const existing = target.get(key);

        if (isDefined(existing)) {
            existing.add(value);
        } else {
            target.set(key, new Set([value]));
        }
    }

    private static toRecord(source: ReadonlyMap<string, ReadonlySet<string>>): Readonly<Record<string, readonly string[]>> {
        return Object.fromEntries([...source].map(([key, values]) => [key, [...values].sort()]));
    }
}
