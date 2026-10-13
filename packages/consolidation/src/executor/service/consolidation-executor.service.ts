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
import type { AtmCashWithdrawalCandidateInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class ConsolidationExecutorService extends Context.Service<ConsolidationExecutorService>()(
    '@budgie/consolidation/ConsolidationExecutorService',
    {
        make: Effect.gen(function* () {
            const consolidationEligibilityService = yield* ConsolidationEligibilityService;
            const consolidationMutationService = yield* ConsolidationMutationService;
            const resolveP2pTransferTitle = yield* P2pTransferTitleResolver;

            const consolidateWithFeeEntries = Effect.fn('ConsolidationExecutorService.consolidateWithFeeEntries')(
                function* <E, R>(
                    consolidationPlan: ConsolidationPlanInterface,
                    createFeeEntries: (
                        sourceTransactions: TransactionWithEntriesEntityInterface[],
                        canonicalTransactionId: number
                    ) => Effect.Effect<void, E, R>
                ) {
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

                    yield* createFeeEntries(sourceTransactions, canonicalTransaction.id);
                    yield* consolidationMutationService.moveSourcesToCanonical(
                        consolidationPlan.sourceTransactionIds,
                        canonicalTransaction.id
                    );

                    return true;
                },
                effect => Db.transaction(effect)
            );

            return {
                consolidateTransfer: (consolidationPlan: ConsolidationPlanInterface) =>
                    consolidateWithFeeEntries(consolidationPlan, (sourceTransactions, canonicalTransactionId) =>
                        consolidationMutationService.createTransferPairFeeEntries(
                            [consolidationPlan.canonicalInput.fromAccountId, consolidationPlan.canonicalInput.toAccountId],
                            sourceTransactions,
                            canonicalTransactionId
                        )
                    ),
                consolidateAtmCashWithdrawal: (
                    candidate: AtmCashWithdrawalCandidateInterface,
                    consolidationPlan: ConsolidationPlanInterface
                ) =>
                    consolidateWithFeeEntries(consolidationPlan, (sourceTransactions, canonicalTransactionId) =>
                        consolidationMutationService.createAtmCashWithdrawalFeeEntry(candidate, sourceTransactions, canonicalTransactionId)
                    ),
                consolidateP2pFiatTransfer: (candidate: P2pFiatTransferCandidateInterface) =>
                    consolidateWithFeeEntries(
                        {
                            sourceTransactionIds: [...candidate.sourceTransactionIds],
                            allowedMovedSourceTransactionIds: [],
                            canonicalInput: {
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
                            }
                        },
                        (sourceTransactions, canonicalTransactionId) =>
                            consolidationMutationService.createP2pFiatTransferFeeEntries(
                                candidate,
                                sourceTransactions,
                                canonicalTransactionId
                            )
                    )
            };
        })
    }
) {
    static readonly layer = Layer.effect(ConsolidationExecutorService, ConsolidationExecutorService.make).pipe(
        Layer.provide([ConsolidationEligibilityService.layer, ConsolidationMutationService.layer])
    );
}
