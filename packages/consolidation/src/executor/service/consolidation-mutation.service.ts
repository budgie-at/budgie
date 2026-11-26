import {
    CategorySourceEnum,
    Db,
    TransactionEntryKindEnum,
    TransactionEntryRepository,
    TransactionEntryTypeEnum,
    TransactionRepository,
    TransactionConsolidationRepository,
    TransactionTagsRepository,
    TransactionTypeEnum,
    deriveConsolidationSyncId
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { P2pFiatDirectionEnum } from '../../auto/enum/p2p-fiat-direction.enum';
import { consolidationCopySourceTransactionTags } from '../../shared/utils/consolidation-copy-source-transaction-tags.util';

import type { P2pFiatTransferCandidateInterface } from '../../auto/interface/p2p-fiat-transfer-candidate.interface';
import type { FeeEntrySourceInterface } from '../../query/interface/fee-entry-source.interface';
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

            const isFeeEntry = (entry: TransactionEntryEntityInterface): boolean =>
                (entry.type === TransactionEntryTypeEnum.FEE || entry.categorySource === CategorySourceEnum.FEE) &&
                isPositiveNumber(entry.amount);

            const findFeeEntries = (
                accountIds: readonly number[],
                sourceTransactions: readonly TransactionWithEntriesEntityInterface[]
            ): TransactionEntryEntityInterface[] => {
                const accountIdSet = new Set(accountIds);

                return sourceTransactions
                    .flatMap(transaction => transaction.entries)
                    .filter(entry => accountIdSet.has(entry.accountId) && isFeeEntry(entry));
            };

            const collectDistinctAccountIds = (transactions: readonly TransactionWithEntriesEntityInterface[]): number[] => [
                ...new Set(transactions.flatMap(transaction => transaction.entries.map(entry => entry.accountId)))
            ];

            const buildCanonicalFeeEntry = (feeEntry: FeeEntrySourceInterface, canonicalTransactionId: number) => ({
                transactionId: canonicalTransactionId,
                accountId: feeEntry.accountId,
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
            });

            const createCanonicalFeeEntries = (feeEntries: readonly FeeEntrySourceInterface[], canonicalTransactionId: number) =>
                transactionEntryRepository.bulkCreate(feeEntries.map(feeEntry => buildCanonicalFeeEntry(feeEntry, canonicalTransactionId)));

            const findUncategorizedSyncedEntry = Effect.fnUntraced(function* (syncedTransaction: TransactionWithEntriesEntityInterface) {
                const syncedTags = yield* transactionTagsRepository.findByTransactionId(syncedTransaction.id);

                if (isNotEmptyArray(syncedTags) || isNotEmptyString(syncedTransaction.comment)) {
                    return null;
                }

                return (
                    syncedTransaction.entries.find(
                        entry =>
                            entry.kind === TransactionEntryKindEnum.PRIMARY &&
                            entry.type !== TransactionEntryTypeEnum.FEE &&
                            ((!isDefined(entry.categoryId) && entry.categorySource === CategorySourceEnum.USER) ||
                                entry.categorySource === CategorySourceEnum.MCC_DEFAULT)
                    ) ?? null
                );
            });

            const deriveCanonicalSyncId = Effect.fnUntraced(function* (
                sourceTransactionIds: readonly number[],
                sourceTransactions?: readonly TransactionWithEntriesEntityInterface[]
            ) {
                const sources = isDefined(sourceTransactions)
                    ? sourceTransactions
                    : yield* transactionRepository.findByIds([...sourceTransactionIds]);
                const sourceSyncIds = sources.map(source => source.syncId).filter(isDefined);

                if (sourceSyncIds.length !== sourceTransactionIds.length) {
                    return null;
                }

                const syncId = deriveConsolidationSyncId(sourceSyncIds);
                const claimed = yield* transactionRepository.findClaimedPersonalSyncIds([syncId]);

                return claimed.has(syncId) ? null : syncId;
            });

            const createCanonicalTransfer = Effect.fn('ConsolidationMutationService.createCanonicalTransfer')(function* (
                input: CanonicalTransferInputInterface,
                sourceTransactionIds: readonly number[],
                sourceTransactions?: readonly TransactionWithEntriesEntityInterface[]
            ) {
                const syncId = yield* deriveCanonicalSyncId(sourceTransactionIds, sourceTransactions);
                const canonicalTransaction = yield* transactionRepository.create({
                    ...(isDefined(syncId) && { syncId }),
                    type: TransactionTypeEnum.TRANSFER,
                    title: input.title,
                    externalId: null,
                    operatedAt: DateTime.toDateUtc(DateTime.makeUnsafe(input.operatedAt * 1000)),
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
            });

            const createMissingTransferFeeEntries = Effect.fn('ConsolidationMutationService.createMissingTransferFeeEntries')(function* (
                targetEntries: readonly TransactionEntryEntityInterface[],
                sourceTransactions: readonly TransactionWithEntriesEntityInterface[],
                canonicalTransactionId: number,
                candidateAccountIds?: readonly number[]
            ) {
                const existingFeeAccountIds = new Set(targetEntries.filter(isFeeEntry).map(entry => entry.accountId));
                const accountIds = (candidateAccountIds ?? collectDistinctAccountIds(sourceTransactions)).filter(
                    accountId => !existingFeeAccountIds.has(accountId)
                );
                const feeEntries = findFeeEntries(accountIds, sourceTransactions);

                if (isEmptyArray(feeEntries)) {
                    return;
                }

                yield* createCanonicalFeeEntries(feeEntries, canonicalTransactionId);
            });

            const moveSourcesToCanonical = Effect.fn('ConsolidationMutationService.moveSourcesToCanonical')(function* (
                sourceTransactionIds: number[],
                canonicalTransactionId: number
            ) {
                yield* transactionEntryRepository.moveToConsolidatedTransaction(sourceTransactionIds, canonicalTransactionId);
                yield* transactionConsolidationRepository.setConsolidationParent(sourceTransactionIds, canonicalTransactionId);
            });

            return {
                createCanonicalTransfer,
                createCanonicalTransferWithFeesAndMove: Effect.fn('ConsolidationMutationService.createCanonicalTransferWithFeesAndMove')(
                    function* (
                        input: CanonicalTransferInputInterface,
                        sourceTransactionIds: number[],
                        sourceTransactions: readonly TransactionWithEntriesEntityInterface[]
                    ) {
                        const canonicalTransaction = yield* createCanonicalTransfer(input, sourceTransactionIds, sourceTransactions);

                        yield* createMissingTransferFeeEntries([], sourceTransactions, canonicalTransaction.id);
                        yield* moveSourcesToCanonical(sourceTransactionIds, canonicalTransaction.id);

                        return canonicalTransaction;
                    }
                ),
                createAtmCashWithdrawalFeeEntry: Effect.fn('ConsolidationMutationService.createAtmCashWithdrawalFeeEntry')(function* (
                    candidate: AtmCashWithdrawalCandidateInterface,
                    sourceTransactions: TransactionWithEntriesEntityInterface[],
                    canonicalTransactionId: number
                ) {
                    const feeEntries = findFeeEntries([candidate.sourceAccountId], sourceTransactions);

                    if (isEmptyArray(feeEntries)) {
                        return;
                    }

                    yield* createCanonicalFeeEntries(feeEntries, canonicalTransactionId);
                }),
                createTransferPairFeeEntries: Effect.fn('ConsolidationMutationService.createTransferPairFeeEntries')(function* (
                    accountIds: number[],
                    sourceTransactions: TransactionWithEntriesEntityInterface[],
                    canonicalTransactionId: number
                ) {
                    const feeEntries = findFeeEntries(accountIds, sourceTransactions);

                    if (isEmptyArray(feeEntries)) {
                        return;
                    }

                    yield* createCanonicalFeeEntries(feeEntries, canonicalTransactionId);
                }),
                createMissingTransferFeeEntries,
                restoreMovedFeeEntries: Effect.fn('ConsolidationMutationService.restoreMovedFeeEntries')(function* (
                    movedFeeEntries: readonly FeeEntrySourceInterface[]
                ) {
                    if (isEmptyArray(movedFeeEntries)) {
                        return [];
                    }

                    return yield* Db.transaction(
                        transactionEntryRepository.bulkCreate(
                            movedFeeEntries.map(feeEntry => buildCanonicalFeeEntry(feeEntry, feeEntry.transactionId))
                        )
                    );
                }),
                createP2pFiatTransferFeeEntries: Effect.fn('ConsolidationMutationService.createP2pFiatTransferFeeEntries')(function* (
                    candidate: P2pFiatTransferCandidateInterface,
                    sourceTransactions: TransactionWithEntriesEntityInterface[],
                    canonicalTransactionId: number
                ) {
                    const bankAccountId =
                        candidate.direction === P2pFiatDirectionEnum.BUY ? candidate.fromAccountId : candidate.toAccountId;
                    const feeEntries = findFeeEntries([bankAccountId], sourceTransactions).filter(entry =>
                        candidate.bankTransactionIds.includes(entry.transactionId)
                    );

                    if (isEmptyArray(feeEntries)) {
                        return;
                    }

                    yield* createCanonicalFeeEntries(feeEntries, canonicalTransactionId);
                }),
                moveSourcesToCanonical,
                copyManualExpenseDuplicateUserData: Effect.fn('ConsolidationMutationService.copyManualExpenseDuplicateUserData')(function* (
                    syncedTransaction: TransactionWithEntriesEntityInterface,
                    manualTransaction: TransactionWithEntriesEntityInterface
                ) {
                    const syncedEntry = yield* findUncategorizedSyncedEntry(syncedTransaction);

                    if (!isDefined(syncedEntry)) {
                        return;
                    }

                    const manualPrimaryEntry = manualTransaction.entries.find(
                        entry => entry.kind === TransactionEntryKindEnum.PRIMARY && entry.type !== TransactionEntryTypeEnum.FEE
                    );

                    if (isDefined(manualPrimaryEntry?.categoryId)) {
                        yield* transactionEntryRepository.updateById(syncedEntry.id, {
                            categoryId: manualPrimaryEntry.categoryId,
                            categorySource: CategorySourceEnum.MANUAL_EXPENSE_DUPLICATE
                        });
                    }

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
