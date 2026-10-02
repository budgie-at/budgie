import { TransactionEntryRepository, TransactionRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

export class ConsolidationEligibilityService extends Context.Service<ConsolidationEligibilityService>()(
    '@budgie/consolidation/ConsolidationEligibilityService',
    {
        make: Effect.gen(function* () {
            const transactionRepository = yield* TransactionRepository;
            const transactionEntryRepository = yield* TransactionEntryRepository;

            const findEligibleSourceTransactions = Effect.fn('ConsolidationEligibilityService.findEligibleSourceTransactions')(function* (
                sourceTransactionIds: number[],
                allowedMovedSourceTransactionIds: number[] = []
            ) {
                const fresh = yield* transactionRepository.findByIds(sourceTransactionIds);

                if (fresh.length !== sourceTransactionIds.length) {
                    return null;
                }

                const movedEntryBlockedTransactionIds = sourceTransactionIds.filter(
                    transactionId => !allowedMovedSourceTransactionIds.includes(transactionId)
                );

                if (yield* transactionEntryRepository.hasMovedSourceEntries(movedEntryBlockedTransactionIds)) {
                    return null;
                }

                if (
                    fresh.every(
                        transaction => !isDefined(transaction.consolidationParentTransactionId) && !isDefined(transaction.deletedAt)
                    )
                ) {
                    return fresh;
                }

                return null;
            });

            const areCandidatesStillEligible = Effect.fn('ConsolidationEligibilityService.areCandidatesStillEligible')(function* (
                sourceTransactionIds: number[],
                allowedMovedSourceTransactionIds: number[] = []
            ) {
                return isDefined(yield* findEligibleSourceTransactions(sourceTransactionIds, allowedMovedSourceTransactionIds));
            });

            return {
                areCandidatesStillEligible,
                findEligibleSourceTransactions,
                isExistingTransferConsolidationStillEligible: Effect.fn(
                    'ConsolidationEligibilityService.isExistingTransferConsolidationStillEligible'
                )(function* (sourceTransactionIds: number[], existingTransferId: number) {
                    if (!(yield* areCandidatesStillEligible(sourceTransactionIds))) {
                        return false;
                    }

                    const transaction = yield* transactionRepository.getByIdRaw(existingTransferId);

                    return (
                        isDefined(transaction) &&
                        !isDefined(transaction.consolidationParentTransactionId) &&
                        !isDefined(transaction.deletedAt)
                    );
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(ConsolidationEligibilityService, ConsolidationEligibilityService.make).pipe(
        Layer.provide([TransactionRepository.layer, TransactionEntryRepository.layer])
    );
}
