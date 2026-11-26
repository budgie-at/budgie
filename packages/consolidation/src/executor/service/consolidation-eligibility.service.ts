import { TransactionEntryRepository, TransactionRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import type { TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class ConsolidationEligibilityService extends Context.Service<ConsolidationEligibilityService>()(
    '@budgie/consolidation/ConsolidationEligibilityService',
    {
        make: Effect.gen(function* () {
            const transactionRepository = yield* TransactionRepository;
            const transactionEntryRepository = yield* TransactionEntryRepository;

            const isEligibleLiveSource = (transaction: TransactionWithEntriesEntityInterface): boolean =>
                !isDefined(transaction.consolidationParentTransactionId) &&
                !isDefined(transaction.deletedAt) &&
                isNotEmptyArray(transaction.entries);

            const findEligibleSourceTransactions = Effect.fn('ConsolidationEligibilityService.findEligibleSourceTransactions')(function* (
                sourceTransactionIds: number[],
                allowedMovedSourceTransactionIds: number[] = []
            ) {
                if (isEmptyArray(sourceTransactionIds)) {
                    return null;
                }

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

                if (fresh.every(isEligibleLiveSource)) {
                    return fresh;
                }

                return null;
            });

            const findEligibleExistingTransferConsolidation = Effect.fn(
                'ConsolidationEligibilityService.findEligibleExistingTransferConsolidation'
            )(function* (sourceTransactionIds: number[], existingTransferId: number) {
                if (isEmptyArray(sourceTransactionIds)) {
                    return null;
                }

                const uniqueIds = [...new Set([...sourceTransactionIds, existingTransferId])];

                if (uniqueIds.length !== sourceTransactionIds.length + 1) {
                    return null;
                }

                const allTransactions = yield* transactionRepository.findByIds(uniqueIds);

                if (
                    allTransactions.length !== uniqueIds.length ||
                    (yield* transactionEntryRepository.hasMovedSourceEntries(sourceTransactionIds))
                ) {
                    return null;
                }

                const existingTransfer = allTransactions.find(transaction => transaction.id === existingTransferId);
                const sourceTransactions = allTransactions.filter(transaction => transaction.id !== existingTransferId);

                if (
                    !isDefined(existingTransfer) ||
                    isDefined(existingTransfer.updatedBy) ||
                    !isEligibleLiveSource(existingTransfer) ||
                    !sourceTransactions.every(isEligibleLiveSource)
                ) {
                    return null;
                }

                return { existingTransfer, sourceTransactions };
            });

            const areCandidatesStillEligible = Effect.fn('ConsolidationEligibilityService.areCandidatesStillEligible')(function* (
                sourceTransactionIds: number[],
                allowedMovedSourceTransactionIds: number[] = []
            ) {
                const eligibleSourceTransactions = yield* findEligibleSourceTransactions(
                    sourceTransactionIds,
                    allowedMovedSourceTransactionIds
                );

                return isDefined(eligibleSourceTransactions);
            });

            return {
                areCandidatesStillEligible,
                findEligibleSourceTransactions,
                findEligibleExistingTransferConsolidation,
                isExistingTransferConsolidationStillEligible: Effect.fn(
                    'ConsolidationEligibilityService.isExistingTransferConsolidationStillEligible'
                )(function* (sourceTransactionIds: number[], existingTransferId: number) {
                    const eligible = yield* findEligibleExistingTransferConsolidation(sourceTransactionIds, existingTransferId);

                    return isDefined(eligible);
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(ConsolidationEligibilityService, ConsolidationEligibilityService.make).pipe(
        Layer.provide([TransactionRepository.layer, TransactionEntryRepository.layer])
    );
}
