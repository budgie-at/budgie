import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import { AccountBalanceIncrementalService, LedgerWorkload } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Semaphore from 'effect/Semaphore';

import { isPositiveNumber } from '@rnw-community/shared';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export class TransferConsolidationService extends Context.Service<TransferConsolidationService>()(
    '@budgie/sync/TransferConsolidationService',
    {
        make: Effect.gen(function* () {
            const ledgerWorkload = yield* LedgerWorkload;
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const exclusive = yield* Semaphore.make(1);

            const runExclusive = <A, E, R>(effect: Effect.Effect<A, E, R>) => exclusive.withPermit(ledgerWorkload.runForeground(effect));

            const updateBalancesAfterConsolidation = Effect.fnUntraced(function* (consolidated: number) {
                if (isPositiveNumber(consolidated)) {
                    yield* accountBalanceIncrementalService.updateAllBalances(true);
                }
            });

            return {
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
        Layer.provide([ConsolidationCoordinatorService.layer, AccountBalanceIncrementalService.layer])
    );
}
