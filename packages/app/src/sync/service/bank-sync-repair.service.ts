import { ExternalSourceEnum, transactionAsync } from '@budgie/contracts';
import { Log, getLogger } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { db } from '../../@generic/drizzle/db/db';
import { foregroundWorkloadService } from '../../@generic/service/foreground-workload.service';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { PRIVATBANK_DUPLICATE_CANDIDATE_SQL } from '../constant/privatbank-duplicate-candidate-sql.constant';

import { bankSyncDuplicateSoftDeleteService } from './bank-sync-duplicate-soft-delete.service';
import { transferConsolidationAutoCandidateService } from './transfer-consolidation-auto-candidate.service';
import { transferConsolidationCandidateService } from './transfer-consolidation-candidate.service';

import type { BankSyncDuplicateCandidateRowInterface } from '../interface/bank-sync-duplicate-candidate-row.interface';
import type { BankSyncDuplicateRepairPreviewInterface } from '../interface/bank-sync-duplicate-repair-preview.interface';
import type { BankSyncDuplicateRepairResultInterface } from '../interface/bank-sync-duplicate-repair-result.interface';
import type { BankSyncDuplicateRepairSourcePreviewInterface } from '../interface/bank-sync-duplicate-repair-source-preview.interface';
import type { BankSyncDuplicateRepairSourceInterface } from '../interface/bank-sync-duplicate-repair-source.interface';
import type { DB, ExistingTransferIncomeDuplicateCandidateInterface } from '@budgie/contracts';

const logger = getLogger('BankSyncRepairService');

class BankSyncRepairService {
    private static readonly ERSTE_DUPLICATE_CANDIDATE_SQL = String.raw`
WITH erste_rows AS (SELECT tx.id AS transaction_id, tx.created_at, tx.operated_at, date(tx.operated_at, 'unixepoch') AS operated_day, tx.type AS transaction_type, tx.title, tx.comment, entry.account_id, entry.type AS entry_type, entry.amount FROM transactions tx INNER JOIN transaction_entries entry ON entry.transaction_id = tx.id AND entry.deleted_at IS NULL AND entry.original_transaction_id IS NULL WHERE tx.external_source = 'ERSTE' AND tx.deleted_at IS NULL AND tx.consolidation_parent_transaction_id IS NULL),
semantic_pairs AS (SELECT CASE WHEN newer.created_at > older.created_at THEN newer.transaction_id WHEN newer.created_at < older.created_at THEN older.transaction_id ELSE MAX(newer.transaction_id, older.transaction_id) END AS duplicateTransactionId, CASE WHEN newer.created_at > older.created_at THEN older.transaction_id WHEN newer.created_at < older.created_at THEN newer.transaction_id ELSE MIN(newer.transaction_id, older.transaction_id) END AS keptTransactionId, 'semantic_duplicate' AS reason FROM erste_rows older INNER JOIN erste_rows newer ON newer.transaction_id > older.transaction_id AND newer.account_id = older.account_id AND newer.transaction_type = older.transaction_type AND newer.entry_type = older.entry_type AND newer.operated_day = older.operated_day AND newer.amount = older.amount AND newer.title = older.title AND newer.comment = older.comment),
ranked_candidates AS (SELECT duplicateTransactionId, keptTransactionId, reason, ROW_NUMBER() OVER (PARTITION BY duplicateTransactionId ORDER BY keptTransactionId) AS candidate_rank FROM semantic_pairs)
SELECT 'ERSTE' AS externalSource, duplicateTransactionId, keptTransactionId, reason FROM ranked_candidates WHERE candidate_rank = 1
`;

    private static readonly SOURCES: readonly BankSyncDuplicateRepairSourceInterface[] = [
        {
            externalSource: ExternalSourceEnum.PRIVATBANK,
            candidateSql: PRIVATBANK_DUPLICATE_CANDIDATE_SQL
        },
        {
            externalSource: ExternalSourceEnum.ERSTE,
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
        result => `done repairedTransactionCount=${result.repairedTransactionCount}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async removeDuplicates(): Promise<BankSyncDuplicateRepairResultInterface> {
        return this.runExclusive(() => foregroundWorkloadService.run(() => this.removeDuplicatesInner()));
    }

    private async buildPreview(): Promise<BankSyncDuplicateRepairPreviewInterface> {
        const candidates = await this.findDuplicateCandidates();
        const consolidationRepairCount = await this.countConsolidationRepairCandidates();

        return this.buildPreviewFromCandidates(candidates, consolidationRepairCount);
    }

    private async countConsolidationRepairCandidates(): Promise<number> {
        return (await this.findConsolidationRepairCandidates()).length;
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
        candidates: readonly BankSyncDuplicateCandidateRowInterface[],
        consolidationRepairCount = 0
    ): BankSyncDuplicateRepairPreviewInterface {
        const duplicateSources = BankSyncRepairService.SOURCES.map(source => this.buildSourcePreview(source, candidates)).filter(source =>
            isPositiveNumber(source.duplicateTransactionCount)
        );
        const sources = this.addConsolidationRepairPreview(duplicateSources, consolidationRepairCount);
        const duplicateTransactionCount = sources.reduce((total, source) => total + source.duplicateTransactionCount, 0);

        return { duplicateTransactionCount, sources };
    }

    private addConsolidationRepairPreview(
        sources: readonly BankSyncDuplicateRepairSourcePreviewInterface[],
        consolidationRepairCount: number
    ): BankSyncDuplicateRepairSourcePreviewInterface[] {
        if (!isPositiveNumber(consolidationRepairCount)) {
            return [...sources];
        }

        const privatbankSource = sources.find(source => source.externalSource === ExternalSourceEnum.PRIVATBANK);

        if (!isDefined(privatbankSource)) {
            return [
                ...sources,
                {
                    duplicateTransactionCount: consolidationRepairCount,
                    externalSource: ExternalSourceEnum.PRIVATBANK
                }
            ];
        }

        return sources.map(source => {
            if (source.externalSource !== ExternalSourceEnum.PRIVATBANK) {
                return source;
            }

            return {
                ...source,
                duplicateTransactionCount: source.duplicateTransactionCount + consolidationRepairCount
            };
        });
    }

    private buildSourcePreview(
        source: BankSyncDuplicateRepairSourceInterface,
        candidates: readonly BankSyncDuplicateCandidateRowInterface[]
    ): BankSyncDuplicateRepairSourcePreviewInterface {
        const sourceCandidates = candidates.filter(candidate => candidate.externalSource === source.externalSource);

        return {
            duplicateTransactionCount: sourceCandidates.length,
            externalSource: source.externalSource
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
        const duplicateResult = await transactionAsync(db, tx => this.removeDuplicatesInTransaction(tx));
        const consolidationRepairCount = await this.repairConsolidationDuplicates();

        return this.mergeConsolidationRepairResult(duplicateResult, consolidationRepairCount);
    }

    private async repairConsolidationDuplicates(): Promise<number> {
        const repairedCount = await transferConsolidationAutoCandidateService.processExistingTransferIncomeDuplicateCandidates(
            await this.findConsolidationRepairCandidates()
        );

        if (isPositiveNumber(repairedCount)) {
            await accountBalanceIncrementalService.updateAllBalances(true);
        }

        return repairedCount;
    }

    private async findConsolidationRepairCandidates(): Promise<ExistingTransferIncomeDuplicateCandidateInterface[]> {
        return transferConsolidationCandidateService.findExistingTransferIncomeDuplicateRepairCandidates();
    }

    private mergeConsolidationRepairResult(
        result: BankSyncDuplicateRepairResultInterface,
        consolidationRepairCount: number
    ): BankSyncDuplicateRepairResultInterface {
        if (!isPositiveNumber(consolidationRepairCount)) {
            return result;
        }

        return {
            repairedTransactionCount: result.repairedTransactionCount + consolidationRepairCount
        };
    }

    private async removeDuplicatesInTransaction(tx: DB): Promise<BankSyncDuplicateRepairResultInterface> {
        const candidates = await this.findDuplicateCandidates(tx);
        const duplicateTransactionIds = candidates.map(candidate => candidate.duplicateTransactionId);

        logger.log('removeDuplicates:candidates', {
            duplicateTransactionIds: duplicateTransactionIds.join(','),
            keptTransactionIds: candidates.map(candidate => candidate.keptTransactionId).join(',')
        });

        const result = await bankSyncDuplicateSoftDeleteService.remove(tx, duplicateTransactionIds);

        return {
            repairedTransactionCount: result.updatedTransactionIds.length
        };
    }
}

export const bankSyncRepairService = new BankSyncRepairService();
