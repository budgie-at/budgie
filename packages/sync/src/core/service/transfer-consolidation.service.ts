import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import { AccountBalanceIncrementalService, InstallmentPlanService, LedgerWorkload, TransactionDebtSettlementService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Semaphore from 'effect/Semaphore';

import { isPositiveNumber } from '@rnw-community/shared';

import { InzhurBankFlowService } from '../../inzhur/service/inzhur-bank-flow.service';

import { OwnTransferRepairService } from './own-transfer-repair.service';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export class TransferConsolidationService extends Context.Service<TransferConsolidationService>()(
    '@budgie/sync/TransferConsolidationService',
    {
        make: Effect.gen(function* () {
            const ledgerWorkload = yield* LedgerWorkload;
            const ownTransfers = yield* OwnTransferRepairService;
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const installmentPlanService = yield* InstallmentPlanService;
            const transactionDebtSettlementService = yield* TransactionDebtSettlementService;
            const inzhurBankFlowService = yield* InzhurBankFlowService;
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
                    yield* inzhurBankFlowService.apply(scope);
                    const result = yield* consolidationCoordinatorService.consolidate(scope);

                    yield* updateBalancesAfterConsolidation(result.consolidated);
                    yield* installmentPlanService.attachDueParts();
                    yield* transactionDebtSettlementService.repairDebtPaymentCategories();
                    yield* ownTransfers.repair(scope);

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
        Layer.provide([
            OwnTransferRepairService.layer,
            ConsolidationCoordinatorService.layer,
            AccountBalanceIncrementalService.layer,
            InstallmentPlanService.layer,
            TransactionDebtSettlementService.layer,
            InzhurBankFlowService.layer
        ])
    );
}
