import * as Effect from 'effect/Effect';

import type { ConsolidationRepositoriesInterface } from '../interface/consolidation-repositories.interface';
import type { ExistingTransferBridgeCandidateInterface, ExistingTransferChainReclaimCandidateInterface } from '@budgie/contracts';

export class ConsolidationCandidateService {
    readonly findExistingTransferIncomeDuplicateRepairCandidates = Effect.fn(
        'ConsolidationCandidateService.findExistingTransferIncomeDuplicateRepairCandidates'
    )(function* (this: ConsolidationCandidateService) {
        const { existingTransferRepository } = this.repositories;
        const existingTransferBridgeCandidates = yield* existingTransferRepository.findBridgeCandidates(null);
        yield* this.yieldNow();
        const existingTransferChainReclaimCandidates = yield* existingTransferRepository.findChainReclaimCandidates(null);
        yield* this.yieldNow();
        const rawExistingTransferIncomeDuplicateCandidates = yield* existingTransferRepository.findIncomeDuplicateCandidates(null);
        yield* this.yieldNow();

        const blockedSourceTransactionIds = this.buildExistingTransferDuplicateBlockedSourceTransactionIdSet(
            existingTransferBridgeCandidates,
            existingTransferChainReclaimCandidates
        );
        const existingTransferIncomeDuplicateCandidates = rawExistingTransferIncomeDuplicateCandidates.filter(
            candidate =>
                !blockedSourceTransactionIds.has(candidate.existingTransferId) &&
                !blockedSourceTransactionIds.has(candidate.duplicateTransactionId)
        );
        yield* this.yieldNow();

        return existingTransferIncomeDuplicateCandidates;
    });

    readonly findBridgeClaimedRepairCandidates = Effect.fn('ConsolidationCandidateService.findBridgeClaimedRepairCandidates')(
        function* (this: ConsolidationCandidateService) {
            const candidates = yield* this.repositories.transferPairRepository.findBridgeClaimedRepairCandidates();
            yield* this.yieldNow();

            return candidates;
        }
    );

    readonly countManualReviewCandidates = Effect.fn('ConsolidationCandidateService.countManualReviewCandidates')(
        function* (this: ConsolidationCandidateService) {
            const [manualReviewCandidates, atmCashWithdrawalReviewCandidates, refundReviewCandidates] = yield* Effect.all(
                [
                    this.repositories.transferPairRepository.findManualReviewCandidates(),
                    this.repositories.atmCashWithdrawalRepository.findReviewCandidates(),
                    this.repositories.refundPairRepository.findReviewCandidates()
                ],
                { concurrency: 'unbounded' }
            );
            yield* this.yieldNow();

            return manualReviewCandidates.length + atmCashWithdrawalReviewCandidates.length + refundReviewCandidates.length;
        }
    );

    constructor(
        private readonly repositories: Pick<
            ConsolidationRepositoriesInterface,
            'atmCashWithdrawalRepository' | 'existingTransferRepository' | 'refundPairRepository' | 'transferPairRepository'
        >,
        private readonly yieldControl: () => Promise<void>
    ) {}

    private yieldNow(): Effect.Effect<void> {
        return Effect.promise(() => this.yieldControl());
    }

    private buildExistingTransferDuplicateBlockedSourceTransactionIdSet(
        existingTransferBridgeCandidates: ExistingTransferBridgeCandidateInterface[],
        existingTransferChainReclaimCandidates: ExistingTransferChainReclaimCandidateInterface[]
    ): Set<number> {
        const sourceTransactionIds = this.buildExistingTransferBridgeSourceTransactionIdSet(existingTransferBridgeCandidates);
        const existingTransferChainReclaimSourceTransactionIds = this.buildExistingTransferChainReclaimSourceTransactionIdSet(
            existingTransferChainReclaimCandidates
        );

        for (const sourceTransactionId of existingTransferChainReclaimSourceTransactionIds) {
            sourceTransactionIds.add(sourceTransactionId);
        }

        return sourceTransactionIds;
    }

    private buildExistingTransferBridgeSourceTransactionIdSet(candidates: ExistingTransferBridgeCandidateInterface[]): Set<number> {
        return new Set(
            candidates.flatMap(candidate => [
                candidate.sourceExpenseTransactionId,
                candidate.bridgeIncomeTransactionId,
                candidate.existingTransferId
            ])
        );
    }

    private buildExistingTransferChainReclaimSourceTransactionIdSet(
        candidates: ExistingTransferChainReclaimCandidateInterface[]
    ): Set<number> {
        return new Set(
            candidates.flatMap(candidate => [
                candidate.existingTransferId,
                candidate.bridgeIncomeTransactionId,
                candidate.bridgeExpenseTransactionId
            ])
        );
    }
}
