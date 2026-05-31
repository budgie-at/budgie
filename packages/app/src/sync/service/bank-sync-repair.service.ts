import { ExternalSourceEnum, transactionAsync } from '@budgie/contracts';
import { Log, getLogger } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined, isEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { db } from '../../@generic/drizzle/db/db';
import { foregroundWorkloadService } from '../../@generic/service/foreground-workload.service';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';

import type { BankSyncDuplicateCandidateRowInterface } from '../interface/bank-sync-duplicate-candidate-row.interface';
import type { BankSyncDuplicateRepairPreviewInterface } from '../interface/bank-sync-duplicate-repair-preview.interface';
import type { BankSyncDuplicateRepairResultInterface } from '../interface/bank-sync-duplicate-repair-result.interface';
import type { BankSyncDuplicateRepairSourcePreviewInterface } from '../interface/bank-sync-duplicate-repair-source-preview.interface';
import type { BankSyncDuplicateRepairSourceInterface } from '../interface/bank-sync-duplicate-repair-source.interface';
import type { DB } from '@budgie/contracts';

const logger = getLogger('BankSyncRepairService');

class BankSyncRepairService {
    private static readonly SQLITE_BATCH_SIZE = 500;
    private static readonly PRIVATBANK_DUPLICATE_CANDIDATE_SQL = String.raw`
WITH privatbank_rows AS (SELECT tx.id AS transaction_id, tx.created_at, tx.operated_at, date(tx.operated_at, 'unixepoch') AS operated_day, tx.type AS transaction_type, tx.title, entry.account_id, entry.type AS entry_type, entry.amount, COALESCE(entry.mcc_category_id, -1) AS mcc_category_id FROM transactions tx INNER JOIN transaction_entries entry ON entry.transaction_id = tx.id AND entry.deleted_at IS NULL AND entry.original_transaction_id IS NULL WHERE tx.external_source = 'PRIVATBANK' AND tx.deleted_at IS NULL AND tx.consolidation_parent_transaction_id IS NULL),
visible_candidate_pairs AS (SELECT CASE WHEN newer.created_at > older.created_at THEN newer.transaction_id WHEN newer.created_at < older.created_at THEN older.transaction_id ELSE MAX(newer.transaction_id, older.transaction_id) END AS duplicateTransactionId, CASE WHEN newer.created_at > older.created_at THEN older.transaction_id WHEN newer.created_at < older.created_at THEN newer.transaction_id ELSE MIN(newer.transaction_id, older.transaction_id) END AS keptTransactionId, 'visible_duplicate' AS reason, newer.operated_at - older.operated_at AS delta_seconds, 2 AS reason_priority FROM privatbank_rows older INNER JOIN privatbank_rows newer ON newer.transaction_id > older.transaction_id AND newer.account_id = older.account_id AND newer.transaction_type = older.transaction_type AND newer.entry_type = older.entry_type AND newer.title = older.title AND newer.amount = older.amount AND newer.mcc_category_id = older.mcc_category_id AND newer.operated_day = older.operated_day AND ABS(newer.operated_at - older.operated_at) BETWEEN 3590 AND 3610),
hidden_sources AS (SELECT source.id AS transaction_id, source.operated_at, date(source.operated_at, 'unixepoch') AS operated_day, source.type AS transaction_type, source.title, moved.account_id, moved.type AS entry_type, moved.amount, COALESCE(moved.mcc_category_id, -1) AS mcc_category_id FROM transactions source INNER JOIN transaction_entries moved ON moved.original_transaction_id = source.id AND moved.deleted_at IS NULL WHERE source.external_source = 'PRIVATBANK' AND source.deleted_at IS NULL AND source.consolidation_parent_transaction_id IS NOT NULL),
hidden_source_pairs AS (SELECT visible.transaction_id AS duplicateTransactionId, hidden.transaction_id AS keptTransactionId, 'hidden_source_duplicate' AS reason, visible.operated_at - hidden.operated_at AS delta_seconds, 1 AS reason_priority FROM hidden_sources hidden INNER JOIN privatbank_rows visible ON visible.account_id = hidden.account_id AND visible.transaction_type = hidden.transaction_type AND visible.entry_type = hidden.entry_type AND visible.title = hidden.title AND visible.amount = hidden.amount AND visible.mcc_category_id = hidden.mcc_category_id AND visible.operated_day = hidden.operated_day AND ABS(visible.operated_at - hidden.operated_at) BETWEEN 3590 AND 3610),
ranked_candidates AS (SELECT duplicateTransactionId, keptTransactionId, reason, ROW_NUMBER() OVER (PARTITION BY duplicateTransactionId ORDER BY reason_priority, ABS(delta_seconds), keptTransactionId) AS candidate_rank FROM (SELECT duplicateTransactionId, keptTransactionId, reason, delta_seconds, reason_priority FROM visible_candidate_pairs UNION ALL SELECT duplicateTransactionId, keptTransactionId, reason, delta_seconds, reason_priority FROM hidden_source_pairs))
SELECT 'PRIVATBANK' AS externalSource, duplicateTransactionId, keptTransactionId, reason FROM ranked_candidates WHERE candidate_rank = 1
`;

    private static readonly ERSTE_DUPLICATE_CANDIDATE_SQL = String.raw`
WITH erste_rows AS (SELECT tx.id AS transaction_id, tx.created_at, tx.operated_at, date(tx.operated_at, 'unixepoch') AS operated_day, tx.type AS transaction_type, tx.title, tx.comment, entry.account_id, entry.type AS entry_type, entry.amount FROM transactions tx INNER JOIN transaction_entries entry ON entry.transaction_id = tx.id AND entry.deleted_at IS NULL AND entry.original_transaction_id IS NULL WHERE tx.external_source = 'ERSTE' AND tx.deleted_at IS NULL AND tx.consolidation_parent_transaction_id IS NULL),
semantic_pairs AS (SELECT CASE WHEN newer.created_at > older.created_at THEN newer.transaction_id WHEN newer.created_at < older.created_at THEN older.transaction_id ELSE MAX(newer.transaction_id, older.transaction_id) END AS duplicateTransactionId, CASE WHEN newer.created_at > older.created_at THEN older.transaction_id WHEN newer.created_at < older.created_at THEN newer.transaction_id ELSE MIN(newer.transaction_id, older.transaction_id) END AS keptTransactionId, 'semantic_duplicate' AS reason FROM erste_rows older INNER JOIN erste_rows newer ON newer.transaction_id > older.transaction_id AND newer.account_id = older.account_id AND newer.transaction_type = older.transaction_type AND newer.entry_type = older.entry_type AND newer.operated_day = older.operated_day AND newer.amount = older.amount AND newer.title = older.title AND newer.comment = older.comment),
ranked_candidates AS (SELECT duplicateTransactionId, keptTransactionId, reason, ROW_NUMBER() OVER (PARTITION BY duplicateTransactionId ORDER BY keptTransactionId) AS candidate_rank FROM semantic_pairs)
SELECT 'ERSTE' AS externalSource, duplicateTransactionId, keptTransactionId, reason FROM ranked_candidates WHERE candidate_rank = 1
`;

    private static readonly PRIVATBANK_TITLE = `${ExternalSourceEnum.PRIVATBANK.slice(0, 1)}${ExternalSourceEnum.PRIVATBANK.slice(1, 6).toLowerCase()}${ExternalSourceEnum.PRIVATBANK.slice(6, 7)}${ExternalSourceEnum.PRIVATBANK.slice(7).toLowerCase()}`;
    private static readonly ERSTE_TITLE = `${ExternalSourceEnum.ERSTE.slice(0, 1)}${ExternalSourceEnum.ERSTE.slice(1).toLowerCase()}`;
    private static readonly SOURCES: readonly BankSyncDuplicateRepairSourceInterface[] = [
        {
            externalSource: ExternalSourceEnum.PRIVATBANK,
            title: BankSyncRepairService.PRIVATBANK_TITLE,
            candidateSql: BankSyncRepairService.PRIVATBANK_DUPLICATE_CANDIDATE_SQL
        },
        {
            externalSource: ExternalSourceEnum.ERSTE,
            title: BankSyncRepairService.ERSTE_TITLE,
            candidateSql: BankSyncRepairService.ERSTE_DUPLICATE_CANDIDATE_SQL
        }
    ];

    private activeOperation: Promise<unknown> | null = null;

    @Log(
        'enter',
        result => `done duplicateTransactionCount=${result.duplicateTransactionCount}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async previewDuplicates(): Promise<BankSyncDuplicateRepairPreviewInterface> {
        return this.runExclusive(() => this.buildPreview());
    }

    @Log(
        'enter',
        result => `done repairedTransactionCount=${result.repairedTransactionCount} repairedEntryCount=${result.repairedEntryCount}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async removeDuplicates(): Promise<BankSyncDuplicateRepairResultInterface> {
        return this.runExclusive(() => foregroundWorkloadService.run(() => this.removeDuplicatesInner()));
    }

    private async buildPreview(): Promise<BankSyncDuplicateRepairPreviewInterface> {
        const candidates = await this.findDuplicateCandidates();

        return this.buildPreviewFromCandidates(candidates);
    }

    private async findDuplicateCandidates(database: DB = db): Promise<BankSyncDuplicateCandidateRowInterface[]> {
        const candidateGroups = await Promise.all(
            BankSyncRepairService.SOURCES.map(source =>
                database.$client.getAllAsync<BankSyncDuplicateCandidateRowInterface>(source.candidateSql)
            )
        );

        return candidateGroups.flat();
    }

    private buildPreviewFromCandidates(
        candidates: readonly BankSyncDuplicateCandidateRowInterface[]
    ): BankSyncDuplicateRepairPreviewInterface {
        const sources = BankSyncRepairService.SOURCES.map(source => this.buildSourcePreview(source, candidates)).filter(source =>
            isPositiveNumber(source.duplicateTransactionCount)
        );
        const duplicateTransactionCount = sources.reduce((total, source) => total + source.duplicateTransactionCount, 0);

        return { duplicateTransactionCount, sources };
    }

    private buildSourcePreview(
        source: BankSyncDuplicateRepairSourceInterface,
        candidates: readonly BankSyncDuplicateCandidateRowInterface[]
    ): BankSyncDuplicateRepairSourcePreviewInterface {
        const duplicateTransactionCount = candidates.filter(candidate => candidate.externalSource === source.externalSource).length;

        return {
            duplicateTransactionCount,
            externalSource: source.externalSource,
            title: source.title
        };
    }

    private async runExclusive<T>(work: () => Promise<T>): Promise<T> {
        const { activeOperation } = this;
        if (isDefined(activeOperation)) {
            await activeOperation.catch(emptyFn);

            return this.runExclusive(work);
        }

        return this.runActiveOperation(work);
    }

    private async runActiveOperation<T>(work: () => Promise<T>): Promise<T> {
        const operation = work();
        this.activeOperation = operation;

        try {
            return await operation;
        } finally {
            if (this.activeOperation === operation) {
                this.activeOperation = null;
            }
        }
    }

    private async removeDuplicatesInner(): Promise<BankSyncDuplicateRepairResultInterface> {
        const result = await transactionAsync(db, tx => this.removeDuplicatesInTransaction(tx));

        if (isPositiveNumber(result.repairedTransactionCount)) {
            await accountBalanceIncrementalService.updateAllBalances(true);
        }

        return result;
    }

    private async removeDuplicatesInTransaction(tx: DB): Promise<BankSyncDuplicateRepairResultInterface> {
        const candidates = await this.findDuplicateCandidates(tx);
        const duplicateTransactionIds = candidates.map(candidate => candidate.duplicateTransactionId);

        if (isEmptyArray(duplicateTransactionIds)) {
            return this.buildEmptyResult();
        }

        logger.log('removeDuplicates:candidates', {
            duplicateTransactionIds: duplicateTransactionIds.join(','),
            keptTransactionIds: candidates.map(candidate => candidate.keptTransactionId).join(',')
        });

        const updatedTransactionIds = await this.softDeleteTransactions(tx, duplicateTransactionIds);

        if (isEmptyArray(updatedTransactionIds)) {
            return this.buildEmptyResult();
        }

        const repairedEntryCount = await this.softDeleteEntries(tx, updatedTransactionIds);
        const repairedCandidates = this.filterCandidatesByDuplicateIds(candidates, updatedTransactionIds);
        const preview = this.buildPreviewFromCandidates(repairedCandidates);

        return {
            repairedEntryCount,
            repairedTransactionCount: updatedTransactionIds.length,
            sources: preview.sources
        };
    }

    private buildEmptyResult(): BankSyncDuplicateRepairResultInterface {
        return {
            repairedEntryCount: 0,
            repairedTransactionCount: 0,
            sources: []
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

    private async softDeleteEntries(tx: DB, updatedTransactionIds: readonly number[]): Promise<number> {
        const chunks = this.chunkIds(updatedTransactionIds);

        return this.softDeleteEntryChunks(tx, chunks);
    }

    private async softDeleteEntryChunks(tx: DB, chunks: readonly number[][], index = 0, repairedEntryCount = 0): Promise<number> {
        const chunk = chunks[index];

        if (!isDefined(chunk)) {
            return repairedEntryCount;
        }

        const entryResult = await tx.$client.runAsync(this.buildTransactionEntryDeleteSql(chunk), chunk);

        return this.softDeleteEntryChunks(tx, chunks, index + 1, repairedEntryCount + entryResult.changes);
    }

    private chunkIds(ids: readonly number[]): number[][] {
        const chunks = [];

        for (let index = 0; index < ids.length; index += BankSyncRepairService.SQLITE_BATCH_SIZE) {
            chunks.push(ids.slice(index, index + BankSyncRepairService.SQLITE_BATCH_SIZE));
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

    private filterCandidatesByDuplicateIds(
        candidates: readonly BankSyncDuplicateCandidateRowInterface[],
        duplicateTransactionIds: readonly number[]
    ): BankSyncDuplicateCandidateRowInterface[] {
        const duplicateTransactionIdSet = new Set(duplicateTransactionIds);

        return candidates.filter(candidate => duplicateTransactionIdSet.has(candidate.duplicateTransactionId));
    }
}

export const bankSyncRepairService = new BankSyncRepairService();
