import { getLogger } from '@budgie/logger';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';

import type { BankSyncDuplicateCandidateRowInterface } from '../interface/bank-sync-duplicate-candidate-row.interface';
import type { BankSyncDuplicateSoftDeleteResultInterface } from '../interface/bank-sync-duplicate-soft-delete-result.interface';
import type { DB } from '@budgie/contracts';

const logger = getLogger('BankSyncDuplicateSoftDeleteService');

class BankSyncDuplicateSoftDeleteService {
    private static readonly SQLITE_BATCH_SIZE = 500;

    async remove(tx: DB, duplicateTransactionIds: readonly number[]): Promise<BankSyncDuplicateSoftDeleteResultInterface> {
        if (isEmptyArray(duplicateTransactionIds)) {
            return this.buildEmptyResult();
        }

        const updatedTransactionIds = await this.softDeleteTransactions(tx, duplicateTransactionIds);

        if (isEmptyArray(updatedTransactionIds)) {
            return this.buildEmptyResult();
        }

        await this.softDeleteEntries(tx, updatedTransactionIds);

        await accountBalanceIncrementalService.updateAllBalances(true, tx);

        return { updatedTransactionIds };
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

    private async softDeleteTransactionChunks(
        tx: DB,
        chunks: readonly number[][],
        index = 0,
        updatedIds: number[] = []
    ): Promise<number[]> {
        const chunk = chunks[index];

        if (!isDefined(chunk)) {
            return updatedIds;
        }

        const rows = await tx.$client.getAllAsync<Pick<BankSyncDuplicateCandidateRowInterface, 'duplicateTransactionId'>>(
            this.buildTransactionDeleteSql(chunk),
            chunk
        );
        updatedIds.push(...rows.map(row => row.duplicateTransactionId));

        return this.softDeleteTransactionChunks(tx, chunks, index + 1, updatedIds);
    }

    private async softDeleteEntries(tx: DB, updatedTransactionIds: readonly number[]): Promise<void> {
        const chunks = this.chunkIds(updatedTransactionIds);

        await this.softDeleteEntryChunks(tx, chunks);
    }

    private async softDeleteEntryChunks(tx: DB, chunks: readonly number[][], index = 0): Promise<void> {
        const chunk = chunks[index];

        if (!isDefined(chunk)) {
            return;
        }

        await tx.$client.runAsync(this.buildTransactionEntryDeleteSql(chunk), chunk);

        await this.softDeleteEntryChunks(tx, chunks, index + 1);
    }

    private chunkIds(ids: readonly number[]): number[][] {
        const chunks = [];

        for (let index = 0; index < ids.length; index += BankSyncDuplicateSoftDeleteService.SQLITE_BATCH_SIZE) {
            chunks.push(ids.slice(index, index + BankSyncDuplicateSoftDeleteService.SQLITE_BATCH_SIZE));
        }

        return chunks;
    }

    private buildTransactionDeleteSql(duplicateTransactionIds: readonly number[]): string {
        const placeholders = duplicateTransactionIds.map(() => '?').join(',');

        logger.log('softDeleteTransactions:chunk', {
            duplicateTransactionIds: duplicateTransactionIds.join(',')
        });

        return String.raw`UPDATE transactions SET deleted_at = unixepoch(), updated_at = unixepoch() WHERE deleted_at IS NULL AND consolidation_parent_transaction_id IS NULL AND id IN (${placeholders}) RETURNING id AS duplicateTransactionId`;
    }

    private buildTransactionEntryDeleteSql(duplicateTransactionIds: readonly number[]): string {
        const placeholders = duplicateTransactionIds.map(() => '?').join(',');

        return String.raw`UPDATE transaction_entries SET deleted_at = unixepoch(), updated_at = unixepoch() WHERE deleted_at IS NULL AND transaction_id IN (${placeholders})`;
    }
}

export const bankSyncDuplicateSoftDeleteService = new BankSyncDuplicateSoftDeleteService();
