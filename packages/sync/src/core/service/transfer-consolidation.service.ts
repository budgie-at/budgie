import { ConsolidationCandidateRepository, ConsolidationCoordinatorService } from '@budgie/consolidation';
import {
    AccountBalanceIncrementalService,
    InstallmentPlanService,
    LedgerWorkload,
    TransactionDebtSettlementService,
    TransactionTransferService
} from '@budgie/ledger';
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
            const consolidationCandidateRepository = yield* ConsolidationCandidateRepository;
            const transactionTransferService = yield* TransactionTransferService;
            const inzhurBankFlowService = yield* InzhurBankFlowService;
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
                                AccountNotFoundError: () => Effect.succeed(false),
                                DebtTransferNotAllowedError: () => Effect.succeed(false),
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
                    yield* inzhurBankFlowService.apply(scope);

                    const coordinated = yield* consolidationCoordinatorService.consolidate(scope);
                    const converted = yield* convertHouseholdTransfers(scope);
                    const result = { found: coordinated.found + converted, consolidated: coordinated.consolidated + converted };

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
            ConsolidationCandidateRepository.layer,
            AccountBalanceIncrementalService.layer,
            InstallmentPlanService.layer,
            TransactionDebtSettlementService.layer,
            TransactionTransferService.layer,
            InzhurBankFlowService.layer
        ])
    );
}
