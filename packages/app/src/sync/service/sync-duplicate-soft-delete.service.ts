import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { SyncDuplicateCandidateRowInterface } from '../interface/sync-duplicate-candidate-row.interface';
import type { SyncDuplicateSoftDeleteResultInterface } from '../interface/sync-duplicate-soft-delete-result.interface';
import type { DB } from '@budgie/contracts';

class SyncDuplicateSoftDeleteService {
    private static readonly SQLITE_BATCH_SIZE = 500;

    @Log(
        (tx, duplicateTransactionIds) => `enter tx=${String(isDefined(tx))} duplicateTransactionIds=${duplicateTransactionIds.join(',')}`,
        (result, tx, duplicateTransactionIds) =>
            `done tx=${String(isDefined(tx))} duplicateTransactionIds=${duplicateTransactionIds.join(',')} updatedTransactionIds=${result.updatedTransactionIds.join(',')}`,
        (error, tx, duplicateTransactionIds) =>
            `throw tx=${String(isDefined(tx))} duplicateTransactionIds=${duplicateTransactionIds.join(',')} error=${getErrorMessage(error)}`
    )
    async remove(tx: DB, duplicateTransactionIds: readonly number[]): Promise<SyncDuplicateSoftDeleteResultInterface> {
        const chunks = Array.from(
            { length: Math.ceil(duplicateTransactionIds.length / SyncDuplicateSoftDeleteService.SQLITE_BATCH_SIZE) },
            (_, index) =>
                duplicateTransactionIds.slice(
                    index * SyncDuplicateSoftDeleteService.SQLITE_BATCH_SIZE,
                    (index + 1) * SyncDuplicateSoftDeleteService.SQLITE_BATCH_SIZE
                )
        );
        const updatedTransactionIds = await chunks.reduce<Promise<number[]>>(
            (previous, chunk) => previous.then(async previousIds => [...previousIds, ...(await this.softDeleteChunk(tx, chunk))]),
            Promise.resolve([])
        );

        return { updatedTransactionIds };
    }

    private async softDeleteChunk(tx: DB, chunk: readonly number[]): Promise<number[]> {
        const rows = await tx.$client.getAllAsync<Pick<SyncDuplicateCandidateRowInterface, 'duplicateTransactionId'>>(
            this.buildTransactionDeleteSql(chunk),
            [...chunk]
        );
        const updatedIds = rows.map(row => row.duplicateTransactionId);

        if (isNotEmptyArray(updatedIds)) {
            await tx.$client.runAsync(this.buildTransactionEntryDeleteSql(updatedIds), updatedIds);
            await tx.$client.runAsync(this.buildConsolidationChildDeleteSql(updatedIds), updatedIds);
        }

        return updatedIds;
    }

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
