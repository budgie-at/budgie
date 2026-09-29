import { Db, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { ConsolidationEligibilityService } from './consolidation-eligibility.service';
import { ConsolidationMutationService } from './consolidation-mutation.service';

import type { P2pFiatTransferCandidateInterface } from '../../auto/interface/p2p-fiat-transfer-candidate.interface';
import type { CanonicalTransferInputInterface } from '../interface/canonical-transfer-input.interface';
import type { ConsolidationExecutorDependenciesInterface } from '../interface/consolidation-executor-dependencies.interface';
import type { ConsolidationPlanInterface } from '../interface/consolidation-plan.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    ExistingTransferBridgeCandidateInterface,
    IbanBridgeChainTransferCandidateInterface,
    IbanBridgeTransferCandidateInterface,
    TransferPairCandidateInterface
} from '@budgie/contracts';

export class ConsolidationExecutorService {
    readonly consolidatePair = Effect.fn('ConsolidationExecutorService.consolidatePair')(function* (
        this: ConsolidationExecutorService,
        candidate: TransferPairCandidateInterface,
        consolidationPlan: ConsolidationPlanInterface
    ) {
        return yield* this.consolidateRequiredSources([candidate.expenseTransactionId, candidate.incomeTransactionId], consolidationPlan);
    });

    readonly consolidateAtmCashWithdrawal = Effect.fn('ConsolidationExecutorService.consolidateAtmCashWithdrawal')(
        function* (
            this: ConsolidationExecutorService,
            candidate: AtmCashWithdrawalCandidateInterface,
            consolidationPlan: ConsolidationPlanInterface
        ) {
            const sourceTransactions = yield* this.consolidationEligibilityService.findEligibleSourceTransactions(
                consolidationPlan.sourceTransactionIds
            );

            if (!isDefined(sourceTransactions)) {
                return false;
            }

            const canonicalTransaction = yield* this.consolidationMutationService.createCanonicalTransfer(consolidationPlan.canonicalInput);

            yield* this.consolidationMutationService.createAtmCashWithdrawalFeeEntry(
                candidate,
                sourceTransactions,
                canonicalTransaction.id
            );
            yield* this.consolidationMutationService.moveSourcesToCanonical(
                consolidationPlan.sourceTransactionIds,
                canonicalTransaction.id
            );

            return true;
        },
        effect => Db.transaction(effect)
    );

    readonly consolidateIbanBridgeTransfer = Effect.fn('ConsolidationExecutorService.consolidateIbanBridgeTransfer')(function* (
        this: ConsolidationExecutorService,
        candidate: IbanBridgeTransferCandidateInterface,
        consolidationPlan: ConsolidationPlanInterface
    ) {
        return yield* this.consolidateRequiredSources([candidate.expenseTransactionId, candidate.incomeTransactionId], consolidationPlan);
    });

    readonly consolidateExistingTransferBridge = Effect.fn('ConsolidationExecutorService.consolidateExistingTransferBridge')(function* (
        this: ConsolidationExecutorService,
        candidate: ExistingTransferBridgeCandidateInterface,
        consolidationPlan: ConsolidationPlanInterface
    ) {
        return yield* this.consolidateRequiredSources(
            [candidate.sourceExpenseTransactionId, candidate.bridgeIncomeTransactionId, candidate.existingTransferId],
            consolidationPlan
        );
    });

    readonly consolidateIbanBridgeChainTransfer = Effect.fn('ConsolidationExecutorService.consolidateIbanBridgeChainTransfer')(function* (
        this: ConsolidationExecutorService,
        candidate: IbanBridgeChainTransferCandidateInterface,
        consolidationPlan: ConsolidationPlanInterface
    ) {
        return yield* this.consolidateRequiredSources(
            [
                candidate.sourceExpenseTransactionId,
                candidate.bridgeIncomeTransactionId,
                candidate.bridgeExpenseTransactionId,
                candidate.targetIncomeTransactionId
            ],
            consolidationPlan
        );
    });

    readonly consolidateP2pFiatTransfer = Effect.fn('ConsolidationExecutorService.consolidateP2pFiatTransfer')(
        function* (this: ConsolidationExecutorService, candidate: P2pFiatTransferCandidateInterface) {
            const sourceTransactionIds = [...candidate.sourceTransactionIds];
            const sourceTransactions = yield* this.consolidationEligibilityService.findEligibleSourceTransactions(sourceTransactionIds);

            if (!isDefined(sourceTransactions)) {
                return false;
            }

            const canonicalTransaction = yield* this.consolidationMutationService.createCanonicalTransfer({
                title: this.dependencies.resolveP2pTransferTitle(candidate.direction, candidate.assetCode),
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

            yield* this.consolidationMutationService.createP2pFiatTransferFeeEntries(
                candidate,
                sourceTransactions,
                canonicalTransaction.id
            );
            yield* this.consolidationMutationService.moveSourcesToCanonical(sourceTransactionIds, canonicalTransaction.id);

            return true;
        },
        effect => Db.transaction(effect)
    );

    private readonly consolidationEligibilityService: ConsolidationEligibilityService;

    private readonly consolidationMutationService: ConsolidationMutationService;

    private readonly consolidateRequiredSources = Effect.fnUntraced(
        function* (
            this: ConsolidationExecutorService,
            requiredSourceTransactionIds: number[],
            consolidationPlan: ConsolidationPlanInterface
        ) {
            if (!this.hasRequiredSourceTransactionIds(consolidationPlan, requiredSourceTransactionIds)) {
                return false;
            }

            return yield* this.executeConsolidation(
                consolidationPlan.sourceTransactionIds,
                consolidationPlan.canonicalInput,
                consolidationPlan.allowedMovedSourceTransactionIds
            );
        },
        effect => Db.transaction(effect)
    );

    private readonly executeConsolidation = Effect.fnUntraced(function* (
        this: ConsolidationExecutorService,
        sourceTransactionIds: number[],
        canonicalInput: CanonicalTransferInputInterface,
        allowedMovedSourceTransactionIds: number[]
    ) {
        if (
            !(yield* this.consolidationEligibilityService.areCandidatesStillEligible(
                sourceTransactionIds,
                allowedMovedSourceTransactionIds
            ))
        ) {
            return false;
        }

        const canonicalTransaction = yield* this.consolidationMutationService.createCanonicalTransfer(canonicalInput);

        yield* this.consolidationMutationService.moveSourcesToCanonical(sourceTransactionIds, canonicalTransaction.id);

        return true;
    });

    constructor(private readonly dependencies: ConsolidationExecutorDependenciesInterface) {
        this.consolidationEligibilityService = new ConsolidationEligibilityService(dependencies);
        this.consolidationMutationService = new ConsolidationMutationService(dependencies);
    }

    private hasRequiredSourceTransactionIds(
        consolidationPlan: ConsolidationPlanInterface,
        requiredSourceTransactionIds: number[]
    ): boolean {
        return requiredSourceTransactionIds.every(sourceTransactionId =>
            consolidationPlan.sourceTransactionIds.includes(sourceTransactionId)
        );
    }
}
