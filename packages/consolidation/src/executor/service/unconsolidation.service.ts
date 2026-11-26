import {
    CategorySourceEnum,
    MccCategoryRepository,
    SettingsRepository,
    Db,
    DebtEventRepository,
    ExternalSourceEnum,
    TransactionReceiptRepository,
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

import type { TransactionEntityInterface, TransactionEntryEntityInterface } from '@budgie/contracts';

export class UnconsolidationService extends Context.Service<UnconsolidationService>()('@budgie/consolidation/UnconsolidationService', {
    make: Effect.gen(function* () {
        const transactionEntryRepository = yield* TransactionEntryRepository;
        const transactionReceiptRepository = yield* TransactionReceiptRepository;
        const transactionRepository = yield* TransactionRepository;
        const transactionConsolidationRepository = yield* TransactionConsolidationRepository;
        const transactionTagsRepository = yield* TransactionTagsRepository;
        const mccCategoryRepository = yield* MccCategoryRepository;
        const settingsRepository = yield* SettingsRepository;
        const debtEventRepository = yield* DebtEventRepository;

        const restoreSyncedCategory = Effect.fnUntraced(function* (entry: Pick<TransactionEntryEntityInterface, 'id' | 'mccCategoryId'>) {
            const mccCategory = isDefined(entry.mccCategoryId) ? yield* mccCategoryRepository.findById(entry.mccCategoryId) : null;
            const settings = yield* settingsRepository.getSettings();
            const defaultCategoryId = settings.applyMccDefaultCategory ? mccCategory?.defaultCategoryId : null;

            yield* transactionEntryRepository.updateById(
                entry.id,
                isDefined(defaultCategoryId)
                    ? { categoryId: defaultCategoryId, categorySource: CategorySourceEnum.MCC_DEFAULT }
                    : { categoryId: null, categorySource: CategorySourceEnum.USER }
            );
        });

        const isActiveCanonical = (canonical: TransactionEntityInterface): boolean =>
            isDefined(canonical.consolidationType) &&
            !isDefined(canonical.deletedAt) &&
            !isDefined(canonical.consolidationParentTransactionId);

        const isPreExistingCanonical = (transaction: TransactionEntityInterface): boolean =>
            transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND ||
            transaction.consolidationType === TransactionConsolidationTypeEnum.MANUAL_EXPENSE_DUPLICATE ||
            isDefined(transaction.externalId) ||
            isDefined(transaction.externalSource);

        const restoreManualExpenseDuplicateUserData = Effect.fnUntraced(function* (canonicalTransactionId: number) {
            const canonical = (yield* transactionRepository.findByIdsWithRefundConsolidationHistory([canonicalTransactionId])).at(0);
            const copiedCategoryEntry = canonical?.entries.find(
                entry => !isDefined(entry.originalTransactionId) && entry.categorySource === CategorySourceEnum.MANUAL_EXPENSE_DUPLICATE
            );

            if (!isDefined(canonical)) {
                return;
            }

            const manualTransactionIds = [...new Set(canonical.entries.map(entry => entry.originalTransactionId).filter(isDefined))];

            yield* Effect.forEach(
                manualTransactionIds,
                manualTransactionId =>
                    debtEventRepository.moveByTransactionEntryIds(
                        canonical.entries.filter(entry => entry.originalTransactionId === manualTransactionId).map(entry => entry.id),
                        manualTransactionId
                    ),
                { discard: true }
            );

            const manualTags = yield* transactionTagsRepository.findByTransactionIds(manualTransactionIds);
            const manualTransactions = yield* transactionRepository.findByIds(manualTransactionIds);
            const receiptSource = manualTransactions.find(
                transaction =>
                    transaction.externalSource === ExternalSourceEnum.RECEIPT ||
                    (transaction.externalSource === ExternalSourceEnum.APPLE_PAY_AUTOMATION &&
                        transaction.consolidationType === TransactionConsolidationTypeEnum.MANUAL_EXPENSE_DUPLICATE)
            );

            if (isDefined(receiptSource)) {
                yield* transactionReceiptRepository.moveToTransaction(canonicalTransactionId, receiptSource.id);
            }

            const hasCopiedComment = manualTransactions.some(
                manual => isNotEmptyString(manual.comment) && manual.comment === canonical.comment
            );

            if (!isDefined(copiedCategoryEntry) && !hasCopiedComment) {
                return;
            }

            if (isDefined(copiedCategoryEntry)) {
                yield* restoreSyncedCategory(copiedCategoryEntry);
            }

            yield* transactionTagsRepository.deleteByTransactionIdAndTagIds(
                canonicalTransactionId,
                manualTags.map(tag => tag.tagId)
            );

            if (hasCopiedComment) {
                yield* transactionRepository.updateById(canonicalTransactionId, { comment: '' });
            }
        });

        const unconsolidateCanonical = Effect.fnUntraced(function* (canonical: TransactionEntityInterface) {
            if (canonical.consolidationType === TransactionConsolidationTypeEnum.MANUAL_EXPENSE_DUPLICATE) {
                yield* restoreManualExpenseDuplicateUserData(canonical.id);
            }

            yield* transactionEntryRepository.moveBackToOriginalTransactions(canonical.id);
            yield* transactionConsolidationRepository.clearConsolidationParent(canonical.id);

            if (isPreExistingCanonical(canonical)) {
                yield* transactionConsolidationRepository.setConsolidationType(canonical.id, null);

                return;
            }

            yield* transactionTagsRepository.deleteByTransactionId(canonical.id);
            yield* transactionEntryRepository.deleteLedgerByTransactionId(canonical.id);
            yield* transactionRepository.deleteById(canonical.id);
        });

        const unconsolidateById = Effect.fn('UnconsolidationService.unconsolidateById')(
            function* (transactionId: number) {
                const canonical = yield* transactionRepository.getByIdRaw(transactionId);

                if (!isDefined(canonical) || !isActiveCanonical(canonical)) {
                    return;
                }

                yield* unconsolidateCanonical(canonical);
            },
            effect => Db.transaction(effect)
        );

        return {
            unconsolidateById,
            revertByUser: Effect.fn('UnconsolidationService.revertByUser')(
                function* (transactionId: number) {
                    const canonical = yield* transactionRepository.getByIdRaw(transactionId);

                    if (!isDefined(canonical) || !isActiveCanonical(canonical)) {
                        return;
                    }

                    if (canonical.consolidationType === TransactionConsolidationTypeEnum.REFUND) {
                        yield* transactionConsolidationRepository.disableRefundAutoPairingForChildren(canonical.id);
                    }

                    yield* unconsolidateCanonical(canonical);
                },
                effect => Db.transaction(effect)
            )
        };
    })
}) {
    static readonly layer = Layer.effect(UnconsolidationService, UnconsolidationService.make).pipe(
        Layer.provide([
            TransactionEntryRepository.layer,
            TransactionReceiptRepository.layer,
            TransactionRepository.layer,
            TransactionConsolidationRepository.layer,
            TransactionTagsRepository.layer,
            MccCategoryRepository.layer,
            SettingsRepository.layer,
            DebtEventRepository.layer
        ])
    );
}
