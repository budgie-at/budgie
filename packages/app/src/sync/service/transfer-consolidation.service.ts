import { Log } from '@budgie/logger';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { emptyFn, getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { foregroundWorkloadService } from '../../@generic/service/foreground-workload.service';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { TRANSFER_CONSOLIDATION_TASK } from '../constant/transfer-consolidation-task.constant';

import { consolidationCoordinatorService } from './consolidation-coordinator.service';

import type { ConsolidationResultInterface } from '@budgie/consolidation';
import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

class TransferConsolidationService {
    private static readonly BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 30;

    private activeOperation: Promise<unknown> | null = null;

    @Log('enter', 'done', error => `throw error=${getErrorMessage(error)}`)
    async registerBackgroundTask(): Promise<void> {
        if (await TaskManager.isTaskRegisteredAsync(TRANSFER_CONSOLIDATION_TASK)) {
            return;
        }

        await BackgroundTask.registerTaskAsync(TRANSFER_CONSOLIDATION_TASK, {
            minimumInterval: TransferConsolidationService.BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES
        });
    }

    @Log(
        scope =>
            `enter appScopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} appScopeTo=${scope?.operatedAtTo.toISOString() ?? ''} appScopeIdCount=${scope?.transactionIds.length ?? 0}`,
        (result, scope) =>
            `done appScopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} appScopeTo=${scope?.operatedAtTo.toISOString() ?? ''} appScopeIdCount=${scope?.transactionIds.length ?? 0} found=${result.found} consolidated=${result.consolidated}`,
        (error, scope) =>
            `throw appScopeFrom=${scope?.operatedAtFrom.toISOString() ?? ''} appScopeTo=${scope?.operatedAtTo.toISOString() ?? ''} appScopeIdCount=${scope?.transactionIds.length ?? 0} error=${getErrorMessage(error)}`
    )
    async consolidate(scope: ConsolidationScanScopeInterface | null = null): Promise<ConsolidationResultInterface> {
        return this.runExclusive(() => this.runConsolidation(scope));
    }

    @Log(
        transactionIds => `enter appTransactionCount=${transactionIds.length}`,
        (result, transactionIds) => `done appTransactionCount=${transactionIds.length} consolidated=${result}`,
        (error, transactionIds) => `throw appTransactionCount=${transactionIds.length} error=${getErrorMessage(error)}`
    )
    async moveAtmCashWithdrawalsToCash(transactionIds: readonly number[]): Promise<number> {
        return this.runExclusive(async () => {
            const consolidated = await consolidationCoordinatorService.moveAtmCashWithdrawalsToCash(transactionIds);

            await this.updateBalancesAfterConsolidation(consolidated);

            return consolidated;
        });
    }

    private async runConsolidation(scope: ConsolidationScanScopeInterface | null): Promise<ConsolidationResultInterface> {
        const result = await consolidationCoordinatorService.consolidate(scope);

        await this.updateBalancesAfterConsolidation(result.consolidated);

        return result;
    }

    private async updateBalancesAfterConsolidation(consolidated: number): Promise<void> {
        if (!isPositiveNumber(consolidated)) {
            return;
        }

        await accountBalanceIncrementalService.updateAllBalances(true);
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
        const operation = foregroundWorkloadService.run(work);
        this.activeOperation = operation;

        try {
            return await operation;
        } finally {
            if (this.activeOperation === operation) {
                this.activeOperation = null;
            }
        }
    }
}

export const transferConsolidationService = new TransferConsolidationService();
