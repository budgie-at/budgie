import { Db, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { ConsolidationEligibilityService } from './consolidation-eligibility.service';
import { ConsolidationMutationService } from './consolidation-mutation.service';
import { P2pTransferTitleResolver } from './p2p-transfer-title-resolver.service';

import type { P2pFiatTransferCandidateInterface } from '../../auto/interface/p2p-fiat-transfer-candidate.interface';
import type { ConsolidationPlanInterface } from '../interface/consolidation-plan.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    ExistingTransferBridgeCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface,
    TransferPairCandidateInterface
} from '@budgie/contracts';

export class ConsolidationExecutorService extends Context.Service<ConsolidationExecutorService>()(
    '@budgie/consolidation/ConsolidationExecutorService',
    {
        make: Effect.gen(function* () {
            const consolidationEligibilityService = yield* ConsolidationEligibilityService;
            const consolidationMutationService = yield* ConsolidationMutationService;
            const resolveP2pTransferTitle = yield* P2pTransferTitleResolver;

            const consolidateRequiredSources = Effect.fnUntraced(
                function* (requiredSourceTransactionIds: number[], consolidationPlan: ConsolidationPlanInterface) {
                    const hasRequiredSourceTransactionIds = requiredSourceTransactionIds.every(sourceTransactionId =>
                        consolidationPlan.sourceTransactionIds.includes(sourceTransactionId)
                    );

                    if (!hasRequiredSourceTransactionIds) {
                        return false;
                    }

                    const sourceTransactions = yield* consolidationEligibilityService.findEligibleSourceTransactions(
                        consolidationPlan.sourceTransactionIds,
                        consolidationPlan.allowedMovedSourceTransactionIds
                    );

                    if (!isDefined(sourceTransactions)) {
                        return false;
                    }

                    const canonicalTransaction = yield* consolidationMutationService.createCanonicalTransfer(
                        consolidationPlan.canonicalInput
                    );

                    yield* consolidationMutationService.createTransferPairFeeEntries(
                        [consolidationPlan.canonicalInput.fromAccountId, consolidationPlan.canonicalInput.toAccountId],
                        sourceTransactions,
                        canonicalTransaction.id
                    );
                    yield* consolidationMutationService.moveSourcesToCanonical(
                        consolidationPlan.sourceTransactionIds,
                        canonicalTransaction.id
                    );

                    return true;
                },
                effect => Db.transaction(effect)
            );

            return {
                consolidatePair: Effect.fn('ConsolidationExecutorService.consolidatePair')(function* (
                    candidate: TransferPairCandidateInterface,
                    consolidationPlan: ConsolidationPlanInterface
                ) {
                    return yield* consolidateRequiredSources(
                        [candidate.expenseTransactionId, candidate.incomeTransactionId],
                        consolidationPlan
                    );
                }),
                consolidateAtmCashWithdrawal: Effect.fn('ConsolidationExecutorService.consolidateAtmCashWithdrawal')(
                    function* (candidate: AtmCashWithdrawalCandidateInterface, consolidationPlan: ConsolidationPlanInterface) {
                        const sourceTransactions = yield* consolidationEligibilityService.findEligibleSourceTransactions(
                            consolidationPlan.sourceTransactionIds
                        );

                        if (!isDefined(sourceTransactions)) {
                            return false;
                        }

                        const canonicalTransaction = yield* consolidationMutationService.createCanonicalTransfer(
                            consolidationPlan.canonicalInput
                        );

                        yield* consolidationMutationService.createAtmCashWithdrawalFeeEntry(
                            candidate,
                            sourceTransactions,
                            canonicalTransaction.id
                        );
                        yield* consolidationMutationService.moveSourcesToCanonical(
                            consolidationPlan.sourceTransactionIds,
                            canonicalTransaction.id
                        );

                        return true;
                    },
                    effect => Db.transaction(effect)
                ),
                consolidateIbanBridgeTransfer: Effect.fn('ConsolidationExecutorService.consolidateIbanBridgeTransfer')(function* (
                    candidate: IbanBridgeTransferCandidateInterface,
                    consolidationPlan: ConsolidationPlanInterface
                ) {
                    return yield* consolidateRequiredSources(
                        [candidate.expenseTransactionId, candidate.incomeTransactionId],
                        consolidationPlan
                    );
                }),
                consolidateExistingTransferBridge: Effect.fn('ConsolidationExecutorService.consolidateExistingTransferBridge')(function* (
                    candidate: ExistingTransferBridgeCandidateInterface,
                    consolidationPlan: ConsolidationPlanInterface
                ) {
                    return yield* consolidateRequiredSources(
                        [candidate.sourceExpenseTransactionId, candidate.bridgeIncomeTransactionId, candidate.existingTransferId],
                        consolidationPlan
                    );
                }),
                consolidateIbanBridgeChainTransfer: Effect.fn('ConsolidationExecutorService.consolidateIbanBridgeChainTransfer')(function* (
                    candidate: IbanBridgeChainTransferCandidateInterface,
                    consolidationPlan: ConsolidationPlanInterface
                ) {
                    return yield* consolidateRequiredSources(
                        [
                            candidate.sourceExpenseTransactionId,
                            candidate.bridgeIncomeTransactionId,
                            candidate.bridgeExpenseTransactionId,
                            candidate.targetIncomeTransactionId
                        ],
                        consolidationPlan
                    );
                }),
                consolidateP2pFiatTransfer: Effect.fn('ConsolidationExecutorService.consolidateP2pFiatTransfer')(
                    function* (candidate: P2pFiatTransferCandidateInterface) {
                        const sourceTransactionIds = [...candidate.sourceTransactionIds];
                        const sourceTransactions =
                            yield* consolidationEligibilityService.findEligibleSourceTransactions(sourceTransactionIds);

                        if (!isDefined(sourceTransactions)) {
                            return false;
                        }

                        const canonicalTransaction = yield* consolidationMutationService.createCanonicalTransfer({
                            title: resolveP2pTransferTitle(candidate.direction, candidate.assetCode),
                            operatedAt: candidate.operatedAt,
                            fromAccountId: candidate.fromAccountId,
                            toAccountId: candidate.toAccountId,
                            fromAmount: candidate.fromAmount,
                            toAmount: candidate.toAmount,
                            exchangeRate: candidate.fromAmount / candidate.toAmount,
                            consolidationType: TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER,
                            fromEntryExchangeRate: candidate.fromEntryExchangeRate,
                            toEntryExchangeRate: candidate.toEntryExchangeRate,
                            fromEntryToIban: candidate.fromEntryToIban
                        });

                        yield* consolidationMutationService.createP2pFiatTransferFeeEntries(
                            candidate,
                            sourceTransactions,
                            canonicalTransaction.id
                        );
                        yield* consolidationMutationService.moveSourcesToCanonical(sourceTransactionIds, canonicalTransaction.id);

                        return true;
                    },
                    effect => Db.transaction(effect)
                )
            };
        })
    }
) {
    static readonly layer = Layer.effect(ConsolidationExecutorService, ConsolidationExecutorService.make).pipe(
        Layer.provide([ConsolidationEligibilityService.layer, ConsolidationMutationService.layer])
    );
}
