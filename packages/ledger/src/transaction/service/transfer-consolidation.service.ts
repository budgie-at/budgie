import { ConsolidationCandidateRepository, ConsolidationCoordinatorService } from '@budgie/consolidation';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Semaphore from 'effect/Semaphore';

import { isPositiveNumber } from '@rnw-community/shared';

import { LedgerWorkload } from '../../@generic/port/ledger-workload.port';
import { TransferConsolidationBankFlow } from '../../@generic/port/transfer-consolidation-bank-flow.port';
import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { DepositPayoutService } from '../../account/service/deposit-payout.service';
import { InstallmentPlanService } from '../../installment/service/installment-plan.service';

import { TransactionDebtSettlementService } from './transaction-debt-settlement.service';
import { TransactionTransferService } from './transaction-transfer.service';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export class TransferConsolidationService extends Context.Service<TransferConsolidationService>()(
    '@budgie/ledger/TransferConsolidationService',
    {
        make: Effect.gen(function* () {
            const ledgerWorkload = yield* LedgerWorkload;
            const bankFlow = yield* TransferConsolidationBankFlow;
            const consolidationCoordinatorService = yield* ConsolidationCoordinatorService;
            const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
            const installmentPlanService = yield* InstallmentPlanService;
            const transactionDebtSettlementService = yield* TransactionDebtSettlementService;
            const consolidationCandidateRepository = yield* ConsolidationCandidateRepository;
            const transactionTransferService = yield* TransactionTransferService;
            const depositPayoutService = yield* DepositPayoutService;
            const exclusive = yield* Semaphore.make(1);

            const runExclusive = <A, E, R>(effect: Effect.Effect<A, E, R>) => exclusive.withPermit(ledgerWorkload.runForeground(effect));

            const updateBalancesAfterConsolidation = Effect.fnUntraced(function* (consolidated: number) {
                if (isPositiveNumber(consolidated)) {
                    yield* accountBalanceIncrementalService.updateAllBalances(true);
                }
            });

            const convertHouseholdTransfers = Effect.fnUntraced(function* (scope: ConsolidationScanScopeInterface | null) {
                const candidates = yield* consolidationCandidateRepository.findHouseholdManualAccountTransferCandidates(scope);
                let converted = 0;

                for (const candidate of candidates) {
                    const isConverted = yield* transactionTransferService
                        .convertToTransferAccount(candidate.transactionId, candidate.targetAccountId)
                        .pipe(
                            Effect.catchTags({
                                DepositNegativeBalanceError: () => Effect.succeed(false)
                            })
                        );

                    if (isConverted) {
                        converted += 1;
                    }
                }

                return converted;
            });

            return {
                consolidate: Effect.fn('TransferConsolidationService.consolidate')(function* (
                    scope: ConsolidationScanScopeInterface | null
                ) {
                    yield* bankFlow.prepare(scope);

                    const result = yield* Effect.onError(
                        Effect.gen(function* () {
                            const coordinated = yield* consolidationCoordinatorService.consolidate(scope);
                            const converted = yield* convertHouseholdTransfers(scope);

                            yield* updateBalancesAfterConsolidation(coordinated.consolidated);

                            return {
                                found: coordinated.found + converted,
                                consolidated: coordinated.consolidated + converted
                            };
                        }),
                        () => Effect.ignoreCause(accountBalanceIncrementalService.updateAllBalances(true))
                    );

                    yield* depositPayoutService.reconcile(scope);
                    yield* installmentPlanService.attachDueParts();
                    yield* transactionDebtSettlementService.repairDebtPaymentCategories();
                    yield* bankFlow.repair(scope);

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
            ConsolidationCoordinatorService.layer,
            ConsolidationCandidateRepository.layer,
            AccountBalanceIncrementalService.layer,
            InstallmentPlanService.layer,
            TransactionDebtSettlementService.layer,
            TransactionTransferService.layer,
            DepositPayoutService.layer
        ])
    );
}
