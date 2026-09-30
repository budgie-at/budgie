import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import type { SyncDuplicateCandidateRowInterface } from '../interface/sync-duplicate-candidate-row.interface';
import type { SyncDuplicateSoftDeleteResultInterface } from '../interface/sync-duplicate-soft-delete-result.interface';

class SyncDuplicateSoftDeleteService {
    private static readonly SQLITE_BATCH_SIZE = 500;

    readonly remove = Effect.fn('SyncDuplicateSoftDeleteService.remove')(function* (
        this: SyncDuplicateSoftDeleteService,
        duplicateTransactionIds: readonly number[]
    ) {
        const updatedTransactionIds: number[] = [];

        for (let index = 0; index < duplicateTransactionIds.length; index += SyncDuplicateSoftDeleteService.SQLITE_BATCH_SIZE) {
            updatedTransactionIds.push(
                ...(yield* this.softDeleteChunk(
                    duplicateTransactionIds.slice(index, index + SyncDuplicateSoftDeleteService.SQLITE_BATCH_SIZE)
                ))
            );
        }

        return { updatedTransactionIds } satisfies SyncDuplicateSoftDeleteResultInterface;
    });

    private readonly softDeleteChunk = Effect.fnUntraced(function* (this: SyncDuplicateSoftDeleteService, chunk: readonly number[]) {
        const rows = yield* Db.query(db =>
            db.$client.getAllAsync<Pick<SyncDuplicateCandidateRowInterface, 'duplicateTransactionId'>>(
                this.buildTransactionDeleteSql(chunk),
                [...chunk]
            )
        );
        const updatedIds = rows.map(row => row.duplicateTransactionId);

        if (isNotEmptyArray(updatedIds)) {
            yield* Db.query(db => db.$client.runAsync(this.buildTransactionEntryDeleteSql(updatedIds), updatedIds));
            yield* Db.query(db => db.$client.runAsync(this.buildConsolidationChildDeleteSql(updatedIds), updatedIds));
        }

        return updatedIds;
    });

    private buildTransactionDeleteSql(duplicateTransactionIds: readonly number[]): string {
        const placeholders = duplicateTransactionIds.map(() => '?').join(',');

        return String.raw`UPDATE transactions SET deleted_at = unixepoch(), updated_at = unixepoch() WHERE deleted_at IS NULL AND consolidation_parent_transaction_id IS NULL AND id IN (${placeholders}) RETURNING id AS duplicateTransactionId`;
    }

    private buildTransactionEntryDeleteSql(duplicateTransactionIds: readonly number[]): string {
        const placeholders = duplicateTransactionIds.map(() => '?').join(',');

        return String.raw`UPDATE transaction_entries SET deleted_at = unixepoch(), updated_at = unixepoch() WHERE deleted_at IS NULL AND transaction_id IN (${placeholders})`;
    }

    private buildConsolidationChildDeleteSql(duplicateTransactionIds: readonly number[]): string {
        const placeholders = duplicateTransactionIds.map(() => '?').join(',');

        return String.raw`UPDATE transactions SET deleted_at = unixepoch(), updated_at = unixepoch() WHERE deleted_at IS NULL AND consolidation_parent_transaction_id IN (${placeholders})`;
    }
}

export const syncDuplicateSoftDeleteService = new SyncDuplicateSoftDeleteService();
