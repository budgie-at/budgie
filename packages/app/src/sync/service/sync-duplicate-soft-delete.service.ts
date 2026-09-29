import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isEmptyArray } from '@rnw-community/shared';

import type { SyncDuplicateCandidateRowInterface } from '../interface/sync-duplicate-candidate-row.interface';
import type { SyncDuplicateSoftDeleteResultInterface } from '../interface/sync-duplicate-soft-delete-result.interface';

class SyncDuplicateSoftDeleteService {
    private static readonly SQLITE_BATCH_SIZE = 500;

    readonly remove = Effect.fn('SyncDuplicateSoftDeleteService.remove')(function* (
        this: SyncDuplicateSoftDeleteService,
        duplicateTransactionIds: readonly number[]
    ) {
        if (isEmptyArray(duplicateTransactionIds)) {
            return this.buildEmptyResult();
        }

        const updatedTransactionIds = yield* this.softDeleteTransactions(duplicateTransactionIds);

        if (isEmptyArray(updatedTransactionIds)) {
            return this.buildEmptyResult();
        }

        yield* this.softDeleteEntries(updatedTransactionIds);

        return { updatedTransactionIds } satisfies SyncDuplicateSoftDeleteResultInterface;
    });

    private readonly softDeleteTransactions = Effect.fnUntraced(function* (
        this: SyncDuplicateSoftDeleteService,
        duplicateTransactionIds: readonly number[]
    ) {
        const updatedTransactionIds: number[] = [];

        for (const chunk of this.chunkIds(duplicateTransactionIds)) {
            const rows = yield* Db.query(db =>
                db.$client.getAllAsync<Pick<SyncDuplicateCandidateRowInterface, 'duplicateTransactionId'>>(
                    this.buildTransactionDeleteSql(chunk),
                    chunk
                )
            );
            updatedTransactionIds.push(...rows.map(row => row.duplicateTransactionId));
        }

        return updatedTransactionIds;
    });

    private readonly softDeleteEntries = Effect.fnUntraced(function* (
        this: SyncDuplicateSoftDeleteService,
        updatedTransactionIds: readonly number[]
    ) {
        for (const chunk of this.chunkIds(updatedTransactionIds)) {
            yield* Db.query(db => db.$client.runAsync(this.buildTransactionEntryDeleteSql(chunk), chunk));
        }
    });

    private buildEmptyResult(): SyncDuplicateSoftDeleteResultInterface {
        return {
            updatedTransactionIds: []
        };
    }

    private chunkIds(ids: readonly number[]): number[][] {
        const chunks: number[][] = [];

        for (let index = 0; index < ids.length; index += SyncDuplicateSoftDeleteService.SQLITE_BATCH_SIZE) {
            chunks.push(ids.slice(index, index + SyncDuplicateSoftDeleteService.SQLITE_BATCH_SIZE));
        }

        return chunks;
    }

    private buildTransactionDeleteSql(duplicateTransactionIds: readonly number[]): string {
        const placeholders = duplicateTransactionIds.map(() => '?').join(',');

        return String.raw`UPDATE transactions SET deleted_at = unixepoch(), updated_at = unixepoch() WHERE deleted_at IS NULL AND consolidation_parent_transaction_id IS NULL AND id IN (${placeholders}) RETURNING id AS duplicateTransactionId`;
    }

    private buildTransactionEntryDeleteSql(duplicateTransactionIds: readonly number[]): string {
        const placeholders = duplicateTransactionIds.map(() => '?').join(',');

        return String.raw`UPDATE transaction_entries SET deleted_at = unixepoch(), updated_at = unixepoch() WHERE deleted_at IS NULL AND transaction_id IN (${placeholders})`;
    }
}

export const syncDuplicateSoftDeleteService = new SyncDuplicateSoftDeleteService();
