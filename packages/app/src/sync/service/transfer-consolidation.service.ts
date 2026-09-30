import * as Effect from 'effect/Effect';
import * as Semaphore from 'effect/Semaphore';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { isPositiveNumber } from '@rnw-community/shared';

import { Workload } from '../../@generic/service/workload.service';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { TRANSFER_CONSOLIDATION_TASK } from '../constant/transfer-consolidation-task.constant';

import { consolidationCoordinatorService } from './consolidation-coordinator.service';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

class TransferConsolidationService {
    private static readonly BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 30;
    private static readonly exclusive = Semaphore.makeUnsafe(1);

    readonly registerBackgroundTask = Effect.fn('TransferConsolidationService.registerBackgroundTask')(function* () {
        if (yield* Effect.promise(() => TaskManager.isTaskRegisteredAsync(TRANSFER_CONSOLIDATION_TASK))) {
            return;
        }

        yield* Effect.promise(() =>
            BackgroundTask.registerTaskAsync(TRANSFER_CONSOLIDATION_TASK, {
                minimumInterval: TransferConsolidationService.BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES
            })
        );
    });

    readonly consolidate = Effect.fn('TransferConsolidationService.consolidate')(
        function* (this: TransferConsolidationService, scope: ConsolidationScanScopeInterface | null) {
            const result = yield* consolidationCoordinatorService.consolidate(scope);

            yield* this.updateBalancesAfterConsolidation(result.consolidated);

            return result;
        },
        effect => TransferConsolidationService.runExclusive(effect)
    );

    readonly moveAtmCashWithdrawalsToCash = Effect.fn('TransferConsolidationService.moveAtmCashWithdrawalsToCash')(
        function* (this: TransferConsolidationService, transactionIds: readonly number[]) {
            const consolidated = yield* consolidationCoordinatorService.moveAtmCashWithdrawalsToCash(transactionIds);

            yield* this.updateBalancesAfterConsolidation(consolidated);

            return consolidated;
        },
        effect => TransferConsolidationService.runExclusive(effect)
    );

    private readonly updateBalancesAfterConsolidation = Effect.fnUntraced(function* (consolidated: number) {
        if (isPositiveNumber(consolidated)) {
            yield* accountBalanceIncrementalService.updateAllBalances(true);
        }
    });

    private static readonly runExclusive = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
        TransferConsolidationService.exclusive.withPermit(Workload.use(workload => workload.runForeground(effect)));
}

export const transferConsolidationService = new TransferConsolidationService();
