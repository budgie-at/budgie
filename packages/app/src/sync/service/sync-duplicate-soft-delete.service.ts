import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isEmptyArray } from '@rnw-community/shared';

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
        if (isEmptyArray(duplicateTransactionIds)) {
            return this.buildEmptyResult();
        }

        const updatedTransactionIds = await this.softDeleteTransactions(tx, duplicateTransactionIds);

        if (isEmptyArray(updatedTransactionIds)) {
            return this.buildEmptyResult();
        }

        await this.softDeleteEntries(tx, updatedTransactionIds);

        return { updatedTransactionIds };
    }

    @Log(
        (tx, duplicateTransactionIds) => `enter tx=${String(isDefined(tx))} duplicateTransactionIds=${duplicateTransactionIds.join(',')}`,
        (result, tx, duplicateTransactionIds) =>
            `done tx=${String(isDefined(tx))} duplicateTransactionIds=${duplicateTransactionIds.join(',')} updatedTransactionIds=${result.map(row => row.duplicateTransactionId).join(',')}`,
        (error, tx, duplicateTransactionIds) =>
            `throw tx=${String(isDefined(tx))} duplicateTransactionIds=${duplicateTransactionIds.join(',')} error=${getErrorMessage(error)}`
    )
    private async softDeleteTransactionChunk(
        tx: DB,
        duplicateTransactionIds: readonly number[]
    ): Promise<Pick<SyncDuplicateCandidateRowInterface, 'duplicateTransactionId'>[]> {
        const bindTransactionIds = [...duplicateTransactionIds];

        return tx.$client.getAllAsync<Pick<SyncDuplicateCandidateRowInterface, 'duplicateTransactionId'>>(
            this.buildTransactionDeleteSql(bindTransactionIds),
            bindTransactionIds
        );
    }

    @Log(
        (tx, updatedTransactionIds) => `enter tx=${String(isDefined(tx))} updatedTransactionIds=${updatedTransactionIds.join(',')}`,
        (result, tx, updatedTransactionIds) =>
            `done tx=${String(isDefined(tx))} updatedTransactionIds=${updatedTransactionIds.join(',')} result=${String(result)}`,
        (error, tx, updatedTransactionIds) =>
            `throw tx=${String(isDefined(tx))} updatedTransactionIds=${updatedTransactionIds.join(',')} error=${getErrorMessage(error)}`
    )
    private async softDeleteEntryChunk(tx: DB, updatedTransactionIds: readonly number[]): Promise<void> {
        const bindTransactionIds = [...updatedTransactionIds];

        await tx.$client.runAsync(this.buildTransactionEntryDeleteSql(bindTransactionIds), bindTransactionIds);
    }

    private buildEmptyResult(): SyncDuplicateSoftDeleteResultInterface {
        return {
            updatedTransactionIds: []
        };
    }

    private async softDeleteTransactions(tx: DB, duplicateTransactionIds: readonly number[]): Promise<number[]> {
        const chunks = this.chunkIds(duplicateTransactionIds);

        return this.softDeleteTransactionChunks(tx, chunks);
    }

    private async softDeleteTransactionChunks(tx: DB, chunks: readonly number[][]): Promise<number[]> {
        return chunks.reduce<Promise<number[]>>(async (previousUpdatedIdsPromise, chunk) => {
            const previousUpdatedIds = await previousUpdatedIdsPromise;
            const rows = await this.softDeleteTransactionChunk(tx, chunk);

            return [...previousUpdatedIds, ...rows.map(row => row.duplicateTransactionId)];
        }, Promise.resolve([]));
    }

    private async softDeleteEntries(tx: DB, updatedTransactionIds: readonly number[]): Promise<void> {
        const chunks = this.chunkIds(updatedTransactionIds);

        await this.softDeleteEntryChunks(tx, chunks);
    }

    private async softDeleteEntryChunks(tx: DB, chunks: readonly number[][]): Promise<void> {
        await chunks.reduce<Promise<void>>(async (previousChunkPromise, chunk) => {
            await previousChunkPromise;
            await this.softDeleteEntryChunk(tx, chunk);
        }, Promise.resolve());
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
