import {
    CategorySourceEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntryRepository,
    TransactionRepository,
    TransactionConsolidationRepository,
    TransactionTagsRepository
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import type { TransactionEntityInterface } from '@budgie/contracts';

export class UnconsolidationService extends Context.Service<UnconsolidationService>()('@budgie/consolidation/UnconsolidationService', {
    make: Effect.gen(function* () {
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionConsolidationRepository = yield* TransactionConsolidationRepository;
        const transactionTagsRepository = yield* TransactionTagsRepository;

        const isPreExistingCanonical = (transaction: TransactionEntityInterface | undefined): boolean => {
            if (!isDefined(transaction)) {
                return false;
            }

            return (
                transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND ||
                transaction.consolidationType === TransactionConsolidationTypeEnum.MANUAL_EXPENSE_DUPLICATE ||
                isDefined(transaction.externalId) ||
                isDefined(transaction.externalSource)
            );
        };

        const restoreManualExpenseDuplicateUserData = Effect.fnUntraced(function* (canonicalTransactionId: number) {
            const canonical = (yield* transactionRepository.findByIdsWithRefundConsolidationHistory([canonicalTransactionId])).at(0);
            const copiedCategoryEntry = canonical?.entries.find(
                entry => !isDefined(entry.originalTransactionId) && entry.categorySource === CategorySourceEnum.MANUAL_EXPENSE_DUPLICATE
            );

            if (!isDefined(canonical) || !isDefined(copiedCategoryEntry)) {
                return;
            }

            const manualTransactionIds = [...new Set(canonical.entries.map(entry => entry.originalTransactionId).filter(isDefined))];
            const manualTags = yield* transactionTagsRepository.findByTransactionIds(manualTransactionIds);
            const manualTransactions = yield* transactionRepository.findByIds(manualTransactionIds);

            yield* transactionEntryRepository.updateById(copiedCategoryEntry.id, {
                categoryId: null,
                categorySource: CategorySourceEnum.USER
            });
            yield* transactionTagsRepository.deleteByTransactionIdAndTagIds(
                canonicalTransactionId,
                manualTags.map(tag => tag.tagId)
            );

            if (manualTransactions.some(manual => isNotEmptyString(manual.comment) && manual.comment === canonical.comment)) {
                yield* transactionRepository.updateById(canonicalTransactionId, { comment: '', needsEmbedding: canonical.needsEmbedding });
            }
        });

        return {
            unconsolidateById: Effect.fn('UnconsolidationService.unconsolidateById')(function* (transactionId: number) {
                const canonical = yield* transactionRepository.getByIdRaw(transactionId);

                if (canonical?.consolidationType === TransactionConsolidationTypeEnum.MANUAL_EXPENSE_DUPLICATE) {
                    yield* restoreManualExpenseDuplicateUserData(transactionId);
                }

                yield* transactionEntryRepository.moveBackToOriginalTransactions(transactionId);
                yield* transactionConsolidationRepository.clearConsolidationParent(transactionId);

                if (isPreExistingCanonical(canonical)) {
                    yield* transactionConsolidationRepository.setConsolidationType(transactionId, null);

                    return;
                }

                yield* transactionTagsRepository.deleteByTransactionId(transactionId);
                yield* transactionEntryRepository.deleteLedgerByTransactionId(transactionId);
                yield* transactionRepository.deleteById(transactionId);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(UnconsolidationService, UnconsolidationService.make).pipe(
        Layer.provide([
            TransactionEntryRepository.layer,
            TransactionRepository.layer,
            TransactionConsolidationRepository.layer,
            TransactionTagsRepository.layer
        ])
    );
}
