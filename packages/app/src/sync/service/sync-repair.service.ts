import { ExternalSourceEnum, transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { db } from '../../@generic/drizzle/db/db';
import { foregroundWorkloadService } from '../../@generic/service/foreground-workload.service';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';

import { consolidationCoordinatorService } from './consolidation-coordinator.service';
import { ersteDuplicateRepairSourceService, privatbankDuplicateRepairSourceService } from './sync-duplicate-repair-source.service';
import { syncDuplicateSoftDeleteService } from './sync-duplicate-soft-delete.service';

import type { SyncDuplicateCandidateRowInterface } from '../interface/sync-duplicate-candidate-row.interface';
import type { SyncDuplicateRepairPreviewInterface } from '../interface/sync-duplicate-repair-preview.interface';
import type { SyncDuplicateRepairResultInterface } from '../interface/sync-duplicate-repair-result.interface';
import type { SyncDuplicateRepairSourcePreviewInterface } from '../interface/sync-duplicate-repair-source-preview.interface';
import type { SyncDuplicateRepairSourceStrategyInterface } from '../interface/sync-duplicate-repair-source-strategy.interface';
import type { DB } from '@budgie/contracts';

class SyncRepairService {
    private static readonly SOURCE_STRATEGIES: readonly SyncDuplicateRepairSourceStrategyInterface[] = [
        privatbankDuplicateRepairSourceService,
        ersteDuplicateRepairSourceService
    ];

    private activeOperation: Promise<unknown> | null = null;

    @Log(
        'enter',
        result => `done duplicateTransactionCount=${result.duplicateTransactionCount}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async previewDuplicates(): Promise<SyncDuplicateRepairPreviewInterface> {
        return this.runExclusive(() => this.buildPreview());
    }

    @Log(
        'enter',
        result => `done repairedTransactionCount=${result.repairedTransactionCount}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async removeDuplicates(): Promise<SyncDuplicateRepairResultInterface> {
        return this.runExclusive(() => foregroundWorkloadService.run(() => this.removeDuplicatesInner()));
    }

    @Log(
        database => `enter sourceDatabase=${String(isDefined(database))}`,
        (result, database) =>
            `done sourceDatabase=${String(isDefined(database))} duplicateTransactionIds=${result.map(candidate => candidate.duplicateTransactionId).join(',')}`,
        (error, database) => `throw sourceDatabase=${String(isDefined(database))} error=${getErrorMessage(error)}`
    )
    private async findDuplicateCandidates(database: DB): Promise<SyncDuplicateCandidateRowInterface[]> {
        const candidateGroups = await Promise.all(
            SyncRepairService.SOURCE_STRATEGIES.map(strategy => strategy.findDuplicateCandidates(database))
        );

        return candidateGroups.flat();
    }

    @Log('enter', result => `done repairedCount=${result}`, error => `throw error=${getErrorMessage(error)}`)
    private async repairConsolidationDuplicates(): Promise<number> {
        return consolidationCoordinatorService.repairExistingTransferIncomeDuplicates();
    }

    @Log(
        result => `enter repairedTransactionCount=${result.repairedTransactionCount}`,
        (done, result) => `done repairedTransactionCount=${result.repairedTransactionCount} result=${String(done)}`,
        (error, result) => `throw repairedTransactionCount=${result.repairedTransactionCount} error=${getErrorMessage(error)}`
    )
    private async rebuildBalancesWhenNeeded(result: SyncDuplicateRepairResultInterface): Promise<void> {
        if (isPositiveNumber(result.repairedTransactionCount)) {
            await accountBalanceIncrementalService.updateAllBalances(true);
        }
    }

    @Log(
        tx => `enter tx=${String(isDefined(tx))}`,
        (result, tx) => `done tx=${String(isDefined(tx))} repairedTransactionCount=${result.repairedTransactionCount}`,
        (error, tx) => `throw tx=${String(isDefined(tx))} error=${getErrorMessage(error)}`
    )
    private async removeDuplicatesInTransaction(tx: DB): Promise<SyncDuplicateRepairResultInterface> {
        const candidates = await this.findDuplicateCandidates(tx);
        const duplicateTransactionIds = candidates.map(candidate => candidate.duplicateTransactionId);
        const result = await syncDuplicateSoftDeleteService.remove(tx, duplicateTransactionIds);

        return {
            repairedTransactionCount: result.updatedTransactionIds.length
        };
    }

    private async buildPreview(): Promise<SyncDuplicateRepairPreviewInterface> {
        const candidates = await this.findDuplicateCandidates(db);
        const consolidationRepairCount = await this.countConsolidationRepairCandidates();

        return this.buildPreviewFromCandidates(candidates, consolidationRepairCount);
    }

    private async countConsolidationRepairCandidates(): Promise<number> {
        return consolidationCoordinatorService.countExistingTransferIncomeDuplicateRepairCandidates();
    }

    private buildPreviewFromCandidates(
        candidates: readonly SyncDuplicateCandidateRowInterface[],
        consolidationRepairCount = 0
    ): SyncDuplicateRepairPreviewInterface {
        const duplicateSources = SyncRepairService.SOURCE_STRATEGIES.map(source => this.buildSourcePreview(source, candidates)).filter(
            source => isPositiveNumber(source.duplicateTransactionCount)
        );
        const sources = this.addConsolidationRepairPreview(duplicateSources, consolidationRepairCount);
        const duplicateTransactionCount = sources.reduce((total, source) => total + source.duplicateTransactionCount, 0);

        return { duplicateTransactionCount, sources };
    }

    private addConsolidationRepairPreview(
        sources: readonly SyncDuplicateRepairSourcePreviewInterface[],
        consolidationRepairCount: number
    ): SyncDuplicateRepairSourcePreviewInterface[] {
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
        source: SyncDuplicateRepairSourceStrategyInterface,
        candidates: readonly SyncDuplicateCandidateRowInterface[]
    ): SyncDuplicateRepairSourcePreviewInterface {
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

    private async removeDuplicatesInner(): Promise<SyncDuplicateRepairResultInterface> {
        const duplicateResult = await transactionAsync(db, tx => this.removeDuplicatesInTransaction(tx));
        const consolidationRepairCount = await this.repairConsolidationDuplicates();
        const result = this.mergeConsolidationRepairResult(duplicateResult, consolidationRepairCount);

        await this.rebuildBalancesWhenNeeded(result);

        return result;
    }

    private mergeConsolidationRepairResult(
        result: SyncDuplicateRepairResultInterface,
        consolidationRepairCount: number
    ): SyncDuplicateRepairResultInterface {
        if (!isPositiveNumber(consolidationRepairCount)) {
            return result;
        }

        return {
            repairedTransactionCount: result.repairedTransactionCount + consolidationRepairCount
        };
    }
}

export const syncRepairService = new SyncRepairService();
