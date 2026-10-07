import {
    CategorySourceEnum,
    TransactionEntryKindEnum,
    TransactionEntryRepository,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionConsolidationRepository,
    TransactionTagsRepository,
    TransactionTypeEnum
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { P2pFiatDirectionEnum } from '../../auto/enum/p2p-fiat-direction.enum';
import { consolidationCopySourceTransactionTags } from '../../shared/utils/consolidation-copy-source-transaction-tags.util';

import type { P2pFiatTransferCandidateInterface } from '../../auto/interface/p2p-fiat-transfer-candidate.interface';
import type { CanonicalTransferInputInterface } from '../interface/canonical-transfer-input.interface';
import type {
    AtmCashWithdrawalCandidateInterface,
    TransactionEntryEntityInterface,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';

export class ConsolidationMutationService extends Context.Service<ConsolidationMutationService>()(
    '@budgie/consolidation/ConsolidationMutationService',
    {
        make: Effect.gen(function* () {
            const transactionRepository = yield* TransactionRepository;
            const transactionConsolidationRepository = yield* TransactionConsolidationRepository;
            const transactionEntryRepository = yield* TransactionEntryRepository;
            const transactionTagsRepository = yield* TransactionTagsRepository;

            const findFeeEntries = (
                accountId: number,
                sourceTransactions: TransactionWithEntriesEntityInterface[]
            ): TransactionEntryEntityInterface[] =>
                sourceTransactions
                    .flatMap(transaction => transaction.entries)
                    .filter(
                        entry =>
                            entry.accountId === accountId &&
                            (entry.type === TransactionEntryTypeEnum.FEE || entry.categorySource === CategorySourceEnum.FEE) &&
                            isPositiveNumber(entry.amount)
                    );

            const createCanonicalFeeEntries = Effect.fnUntraced(function* (
                accountId: number,
                feeEntries: TransactionEntryEntityInterface[],
                canonicalTransactionId: number
            ) {
                yield* transactionEntryRepository.bulkCreate(
                    feeEntries.map(feeEntry => ({
                        transactionId: canonicalTransactionId,
                        accountId,
                        categoryId: feeEntry.categoryId,
                        categorySource: feeEntry.categorySource,
                        mccCategoryId: feeEntry.mccCategoryId,
                        type: TransactionEntryTypeEnum.FEE,
                        amount: feeEntry.amount,
                        externalId: null,
                        exchangeRate: feeEntry.exchangeRate,
                        baseInstrumentId: feeEntry.baseInstrumentId,
                        baseExchangeRate: feeEntry.baseExchangeRate,
                        baseAmount: feeEntry.baseAmount,
                        toIban: null,
                        originalTransactionId: null
                    }))
                );
            });

            const findUncategorizedSyncedEntry = Effect.fnUntraced(function* (syncedTransaction: TransactionWithEntriesEntityInterface) {
                const syncedTags = yield* transactionTagsRepository.findByTransactionId(syncedTransaction.id);

                if (isNotEmptyArray(syncedTags) || isNotEmptyString(syncedTransaction.comment)) {
                    return null;
                }

                return (
                    syncedTransaction.entries.find(
                        entry =>
                            entry.kind === TransactionEntryKindEnum.PRIMARY &&
                            entry.type === TransactionEntryTypeEnum.CREDIT &&
                            !isDefined(entry.categoryId) &&
                            entry.categorySource === CategorySourceEnum.USER
                    ) ?? null
                );
            });

            return {
                createCanonicalTransfer: Effect.fn('ConsolidationMutationService.createCanonicalTransfer')(function* (
                    input: CanonicalTransferInputInterface
                ) {
                    const canonicalTransaction = yield* transactionRepository.create({
                        type: TransactionTypeEnum.TRANSFER,
                        title: input.title,
                        externalId: null,
                        operatedAt: new Date(input.operatedAt * 1000),
                        comment: '',
                        toAccountId: input.toAccountId,
                        fromAccountId: input.fromAccountId,
                        exchangeRate: input.exchangeRate,
                        externalSource: null,
                        needsEmbedding: false,
                        consolidationType: input.consolidationType,
                        consolidationParentTransactionId: null,
                        updatedBy: null
                    });

                    yield* transactionEntryRepository.bulkCreate([
                        {
                            transactionId: canonicalTransaction.id,
                            accountId: input.fromAccountId,
                            categoryId: null,
                            mccCategoryId: null,
                            type: TransactionEntryTypeEnum.CREDIT,
                            amount: input.fromAmount,
                            externalId: null,
                            exchangeRate: input.fromEntryExchangeRate,
                            toIban: input.fromEntryToIban,
                            originalTransactionId: null
                        },
                        {
                            transactionId: canonicalTransaction.id,
                            accountId: input.toAccountId,
                            categoryId: null,
                            mccCategoryId: null,
                            type: TransactionEntryTypeEnum.DEBIT,
                            amount: input.toAmount,
                            externalId: null,
                            exchangeRate: input.toEntryExchangeRate,
                            toIban: null,
                            originalTransactionId: null
                        }
                    ]);

                    return canonicalTransaction;
                }),
                createAtmCashWithdrawalFeeEntry: Effect.fn('ConsolidationMutationService.createAtmCashWithdrawalFeeEntry')(function* (
                    candidate: AtmCashWithdrawalCandidateInterface,
                    sourceTransactions: TransactionWithEntriesEntityInterface[],
                    canonicalTransactionId: number
                ) {
                    const feeEntry = findFeeEntries(candidate.sourceAccountId, sourceTransactions).at(0);

                    if (!isDefined(feeEntry)) {
                        return;
                    }

                    yield* createCanonicalFeeEntries(candidate.sourceAccountId, [feeEntry], canonicalTransactionId);
                }),
                createTransferPairFeeEntries: Effect.fn('ConsolidationMutationService.createTransferPairFeeEntries')(function* (
                    accountIds: number[],
                    sourceTransactions: TransactionWithEntriesEntityInterface[],
                    canonicalTransactionId: number
                ) {
                    for (const accountId of new Set(accountIds)) {
                        const feeEntries = findFeeEntries(accountId, sourceTransactions);

                        if (isNotEmptyArray(feeEntries)) {
                            yield* createCanonicalFeeEntries(accountId, feeEntries, canonicalTransactionId);
                        }
                    }
                }),
                restoreMissingTransferFeeEntries: Effect.fn('ConsolidationMutationService.restoreMissingTransferFeeEntries')(function* (
                    canonicalTransaction: TransactionWithEntriesEntityInterface
                ) {
                    const accountIds = [canonicalTransaction.fromAccountId, canonicalTransaction.toAccountId].filter(isDefined);
                    let restored = false;

                    for (const accountId of new Set(accountIds)) {
                        const hasLiveFeeEntry = canonicalTransaction.entries.some(
                            entry =>
                                entry.accountId === accountId &&
                                entry.type === TransactionEntryTypeEnum.FEE &&
                                !isDefined(entry.originalTransactionId)
                        );
                        const movedFeeEntries = findFeeEntries(accountId, [canonicalTransaction]).filter(entry =>
                            isDefined(entry.originalTransactionId)
                        );

                        if (!hasLiveFeeEntry && isNotEmptyArray(movedFeeEntries)) {
                            yield* createCanonicalFeeEntries(accountId, movedFeeEntries, canonicalTransaction.id);
                            restored = true;
                        }
                    }

                    return restored;
                }),
                createP2pFiatTransferFeeEntries: Effect.fn('ConsolidationMutationService.createP2pFiatTransferFeeEntries')(function* (
                    candidate: P2pFiatTransferCandidateInterface,
                    sourceTransactions: TransactionWithEntriesEntityInterface[],
                    canonicalTransactionId: number
                ) {
                    const bankAccountId =
                        candidate.direction === P2pFiatDirectionEnum.BUY ? candidate.fromAccountId : candidate.toAccountId;
                    const feeEntries = findFeeEntries(bankAccountId, sourceTransactions).filter(entry =>
                        candidate.bankTransactionIds.includes(entry.transactionId)
                    );

                    if (!isNotEmptyArray(feeEntries)) {
                        return;
                    }

                    yield* createCanonicalFeeEntries(bankAccountId, feeEntries, canonicalTransactionId);
                }),
                moveSourcesToCanonical: Effect.fn('ConsolidationMutationService.moveSourcesToCanonical')(function* (
                    sourceTransactionIds: number[],
                    canonicalTransactionId: number
                ) {
                    yield* transactionEntryRepository.moveToConsolidatedTransaction(sourceTransactionIds, canonicalTransactionId);
                    yield* transactionConsolidationRepository.setConsolidationParent(sourceTransactionIds, canonicalTransactionId);
                }),
                copyManualExpenseDuplicateUserData: Effect.fn('ConsolidationMutationService.copyManualExpenseDuplicateUserData')(function* (
                    syncedTransaction: TransactionWithEntriesEntityInterface,
                    manualTransaction: TransactionWithEntriesEntityInterface
                ) {
                    const syncedEntry = yield* findUncategorizedSyncedEntry(syncedTransaction);

                    if (!isDefined(syncedEntry)) {
                        return;
                    }

                    yield* transactionEntryRepository.updateById(syncedEntry.id, {
                        categoryId: manualTransaction.entries.at(0)?.categoryId ?? null,
                        categorySource: CategorySourceEnum.MANUAL_EXPENSE_DUPLICATE
                    });
                    yield* consolidationCopySourceTransactionTags(transactionTagsRepository, [manualTransaction.id], syncedTransaction.id);

                    if (isNotEmptyString(manualTransaction.comment)) {
                        yield* transactionRepository.updateById(syncedTransaction.id, {
                            comment: manualTransaction.comment
                        });
                    }
                }),
                copySourceTags: Effect.fn('ConsolidationMutationService.copySourceTags')(function* (
                    sourceTransactionIds: number[],
                    canonicalTransactionId: number
                ) {
                    yield* consolidationCopySourceTransactionTags(transactionTagsRepository, sourceTransactionIds, canonicalTransactionId);
                })
            };
        })
    }
) {
    static readonly layer = Layer.effect(ConsolidationMutationService, ConsolidationMutationService.make).pipe(
        Layer.provide([
            TransactionRepository.layer,
            TransactionConsolidationRepository.layer,
            TransactionEntryRepository.layer,
            TransactionTagsRepository.layer
        ])
    );
}
