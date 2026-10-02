import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Semaphore from 'effect/Semaphore';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { isPositiveNumber } from '@rnw-community/shared';

import { Workload } from '../../@generic/service/workload.service';
import { TRANSFER_CONSOLIDATION_TASK } from '../constant/transfer-consolidation-task.constant';
import { consolidationCoordinatorLayer } from '../layer/consolidation-coordinator.layer';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export class TransferConsolidationService extends Context.Service<TransferConsolidationService>()(
    '@budgie/app/TransferConsolidationService',
    {
        make: Effect.gen(function* () {
            const workload = yield* Workload;
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const exclusive = yield* Semaphore.make(1);
            const backgroundTaskMinimumIntervalMinutes = 30;

            const runExclusive = <A, E, R>(effect: Effect.Effect<A, E, R>) => exclusive.withPermit(workload.runForeground(effect));

            const updateBalancesAfterConsolidation = Effect.fnUntraced(function* (consolidated: number) {
                if (isPositiveNumber(consolidated)) {
                    yield* accountBalanceIncrementalService.updateAllBalances(true);
                }
            });

            return {
                registerBackgroundTask: Effect.fn('TransferConsolidationService.registerBackgroundTask')(function* () {
                    if (yield* Effect.promise(() => TaskManager.isTaskRegisteredAsync(TRANSFER_CONSOLIDATION_TASK))) {
                        return;
                    }

                    yield* Effect.promise(() =>
                        BackgroundTask.registerTaskAsync(TRANSFER_CONSOLIDATION_TASK, {
                            minimumInterval: backgroundTaskMinimumIntervalMinutes
                        })
                    );
                }),
                consolidate: Effect.fn('TransferConsolidationService.consolidate')(function* (
                    scope: ConsolidationScanScopeInterface | null
                ) {
                    const result = yield* consolidationCoordinatorService.consolidate(scope);

                    yield* updateBalancesAfterConsolidation(result.consolidated);

                    return result;
                }, runExclusive),
                moveAtmCashWithdrawalsToCash: Effect.fn('TransferConsolidationService.moveAtmCashWithdrawalsToCash')(function* (
                    transactionIds: readonly number[]
                ) {
                    const consolidated = yield* consolidationCoordinatorService.moveAtmCashWithdrawalsToCash(transactionIds);

                    yield* updateBalancesAfterConsolidation(consolidated);

                    return consolidated;
                }, runExclusive)
            };
        })
    }
) {
    static readonly layer = Layer.effect(TransferConsolidationService, TransferConsolidationService.make).pipe(
        Layer.provide([Workload.layer, consolidationCoordinatorLayer, AccountBalanceIncrementalService.layer])
    );
}
