import { Log } from '@budgie/logger';

import { isEmptyArray } from '@rnw-community/shared';

import type { BankSyncDuplicateCandidateRowInterface } from '../interface/bank-sync-duplicate-candidate-row.interface';
import type { BankSyncDuplicateSoftDeleteResultInterface } from '../interface/bank-sync-duplicate-soft-delete-result.interface';
import type { DB } from '@budgie/contracts';

class BankSyncDuplicateSoftDeleteService {
    private static readonly SQLITE_BATCH_SIZE = 500;

    @Log.withoutErrorPayload()
    async remove(tx: DB, duplicateTransactionIds: readonly number[]): Promise<BankSyncDuplicateSoftDeleteResultInterface> {
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

    @Log.withoutErrorPayload()
    private async softDeleteTransactionChunk(
        tx: DB,
        duplicateTransactionIds: readonly number[]
    ): Promise<Pick<BankSyncDuplicateCandidateRowInterface, 'duplicateTransactionId'>[]> {
        const bindTransactionIds = [...duplicateTransactionIds];

        return tx.$client.getAllAsync<Pick<BankSyncDuplicateCandidateRowInterface, 'duplicateTransactionId'>>(
            this.buildTransactionDeleteSql(bindTransactionIds),
            bindTransactionIds
        );
    }

    @Log.withoutErrorPayload()
    private async softDeleteEntryChunk(tx: DB, updatedTransactionIds: readonly number[]): Promise<void> {
        const bindTransactionIds = [...updatedTransactionIds];

        await tx.$client.runAsync(this.buildTransactionEntryDeleteSql(bindTransactionIds), bindTransactionIds);
    }

    private buildEmptyResult(): BankSyncDuplicateSoftDeleteResultInterface {
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

        for (let index = 0; index < ids.length; index += BankSyncDuplicateSoftDeleteService.SQLITE_BATCH_SIZE) {
            chunks.push(ids.slice(index, index + BankSyncDuplicateSoftDeleteService.SQLITE_BATCH_SIZE));
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

export const bankSyncDuplicateSoftDeleteService = new BankSyncDuplicateSoftDeleteService();
