import { ExternalSourceEnum, transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { db } from '../../@generic/drizzle/db/db';
import { foregroundWorkloadService } from '../../@generic/service/foreground-workload.service';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';

import { ersteDuplicateRepairSourceService, privatbankDuplicateRepairSourceService } from './bank-sync-duplicate-repair-source.service';
import { bankSyncDuplicateSoftDeleteService } from './bank-sync-duplicate-soft-delete.service';
import { transferConsolidationAutoCandidateService } from './transfer-consolidation-auto-candidate.service';
import { transferConsolidationCandidateService } from './transfer-consolidation-candidate.service';

import type { BankSyncDuplicateCandidateRowInterface } from '../interface/bank-sync-duplicate-candidate-row.interface';
import type { BankSyncDuplicateRepairPreviewInterface } from '../interface/bank-sync-duplicate-repair-preview.interface';
import type { BankSyncDuplicateRepairResultInterface } from '../interface/bank-sync-duplicate-repair-result.interface';
import type { BankSyncDuplicateRepairSourcePreviewInterface } from '../interface/bank-sync-duplicate-repair-source-preview.interface';
import type { BankSyncDuplicateRepairSourceStrategyInterface } from '../interface/bank-sync-duplicate-repair-source-strategy.interface';
import type { DB, ExistingTransferIncomeDuplicateCandidateInterface } from '@budgie/contracts';

class BankSyncRepairService {
    private static readonly SOURCE_STRATEGIES: readonly BankSyncDuplicateRepairSourceStrategyInterface[] = [
        privatbankDuplicateRepairSourceService,
        ersteDuplicateRepairSourceService
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

    @Log(
        database => `enter sourceDatabase=${String(isDefined(database))}`,
        (result, database) =>
            `done sourceDatabase=${String(isDefined(database))} duplicateTransactionIds=${result.map(candidate => candidate.duplicateTransactionId).join(',')}`,
        (error, database) => `throw sourceDatabase=${String(isDefined(database))} error=${getErrorMessage(error)}`
    )
    private async findDuplicateCandidates(database: DB): Promise<BankSyncDuplicateCandidateRowInterface[]> {
        const candidateGroups = await Promise.all(
            BankSyncRepairService.SOURCE_STRATEGIES.map(strategy => strategy.findDuplicateCandidates(database))
        );

        return candidateGroups.flat();
    }

    @Log('enter', result => `done repairedCount=${result}`, error => `throw error=${getErrorMessage(error)}`)
    private async repairConsolidationDuplicates(): Promise<number> {
        const repairedCount = await transferConsolidationAutoCandidateService.processExistingTransferIncomeDuplicateCandidates(
            await this.findConsolidationRepairCandidates()
        );

        if (isPositiveNumber(repairedCount)) {
            await accountBalanceIncrementalService.updateAllBalances(true);
        }

        return repairedCount;
    }

    @Log(
        tx => `enter tx=${String(isDefined(tx))}`,
        (result, tx) => `done tx=${String(isDefined(tx))} repairedTransactionCount=${result.repairedTransactionCount}`,
        (error, tx) => `throw tx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    private async removeDuplicatesInTransaction(tx: DB): Promise<BankSyncDuplicateRepairResultInterface> {
        const candidates = await this.findDuplicateCandidates(tx);
        const duplicateTransactionIds = candidates.map(candidate => candidate.duplicateTransactionId);
        const result = await bankSyncDuplicateSoftDeleteService.remove(tx, duplicateTransactionIds);

        return {
            repairedTransactionCount: result.updatedTransactionIds.length
        };
    }

    private async buildPreview(): Promise<BankSyncDuplicateRepairPreviewInterface> {
        const candidates = await this.findDuplicateCandidates(db);
        const consolidationRepairCount = await this.countConsolidationRepairCandidates();

        return this.buildPreviewFromCandidates(candidates, consolidationRepairCount);
    }

    private async countConsolidationRepairCandidates(): Promise<number> {
        return (await this.findConsolidationRepairCandidates()).length;
    }

    private buildPreviewFromCandidates(
        candidates: readonly BankSyncDuplicateCandidateRowInterface[],
        consolidationRepairCount = 0
    ): BankSyncDuplicateRepairPreviewInterface {
        const duplicateSources = BankSyncRepairService.SOURCE_STRATEGIES.map(source => this.buildSourcePreview(source, candidates)).filter(
            source => isPositiveNumber(source.duplicateTransactionCount)
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
        source: BankSyncDuplicateRepairSourceStrategyInterface,
        candidates: readonly BankSyncDuplicateCandidateRowInterface[]
    ): BankSyncDuplicateRepairSourcePreviewInterface {
        const sourceCandidates = candidates.filter(candidate => candidate.externalSource === source.externalSource);

        return {
            duplicateTransactionCount: sourceCandidates.length,
            externalSource: source.externalSource
        };
    }

    private async runExclusive<T>(work: () => Promise<T>): Promise<T> {
        if (isDefined(this.activeOperation)) {
            return this.activeOperation.catch(emptyFn).then(() => this.runExclusive(work));
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
}

export const bankSyncRepairService = new BankSyncRepairService();
