import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import type { ConsolidationExecutorDependenciesInterface } from '../interface/consolidation-executor-dependencies.interface';

export class ConsolidationEligibilityService {
    readonly areCandidatesStillEligible = Effect.fn('ConsolidationEligibilityService.areCandidatesStillEligible')(function* (
        this: ConsolidationEligibilityService,
        sourceTransactionIds: number[],
        allowedMovedSourceTransactionIds: number[] = []
    ) {
        return isDefined(yield* this.findEligibleSourceTransactions(sourceTransactionIds, allowedMovedSourceTransactionIds));
    });

    readonly findEligibleSourceTransactions = Effect.fn('ConsolidationEligibilityService.findEligibleSourceTransactions')(function* (
        this: ConsolidationEligibilityService,
        sourceTransactionIds: number[],
        allowedMovedSourceTransactionIds: number[] = []
    ) {
        const fresh = yield* this.dependencies.transactionRepository.findByIds(sourceTransactionIds);

        if (fresh.length !== sourceTransactionIds.length) {
            return null;
        }

        const movedEntryBlockedTransactionIds = sourceTransactionIds.filter(
            transactionId => !allowedMovedSourceTransactionIds.includes(transactionId)
        );

        if (yield* this.dependencies.transactionEntryRepository.hasMovedSourceEntries(movedEntryBlockedTransactionIds)) {
            return null;
        }

        if (fresh.every(transaction => !isDefined(transaction.consolidationParentTransactionId) && !isDefined(transaction.deletedAt))) {
            return fresh;
        }

        return null;
    });

    readonly isExistingTransferConsolidationStillEligible = Effect.fn(
        'ConsolidationEligibilityService.isExistingTransferConsolidationStillEligible'
    )(function* (this: ConsolidationEligibilityService, sourceTransactionIds: number[], existingTransferId: number) {
        if (!(yield* this.areCandidatesStillEligible(sourceTransactionIds))) {
            return false;
        }

        const transaction = yield* this.dependencies.transactionRepository.getByIdRaw(existingTransferId);

        return isDefined(transaction) && !isDefined(transaction.consolidationParentTransactionId) && !isDefined(transaction.deletedAt);
    });

    constructor(private readonly dependencies: ConsolidationExecutorDependenciesInterface) {}
}
