import {
    AccountRepository,
    Db,
    DebtEventRepository,
    TransactionConsolidationTypeEnum,
    TransactionEntryRepository,
    TransactionEntryTypeEnum,
    TransactionConsolidationRepository,
    TransactionRepository,
    TransactionTagsRepository,
    TransactionTypeEnum
} from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isEmptyArray, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { RefundPairRepository } from '../../query/repository/refund-pair.repository';
import { consolidationCopySourceTransactionTags } from '../../shared/utils/consolidation-copy-source-transaction-tags.util';
import { isPrivatbankSameOriginalAmount } from '../../shared/utils/is-privatbank-same-original-amount.util';
import { RefundAlreadyConsolidatedError } from '../error/refund-already-consolidated.error';
import { RefundExceedsExpenseError } from '../error/refund-exceeds-expense.error';
import { RefundNotFromIncomeError } from '../error/refund-not-from-income.error';
import { RefundTransactionNotFoundError } from '../error/refund-transaction-not-found.error';
import { computeRefundCapacityUsage } from '../utils/compute-refund-capacity-usage.util';
import { isPrivatbankClosedByAbsorbedRefunds } from '../utils/is-privatbank-closed-by-absorbed-refunds.util';

import type { ConvertToRefundParamsInterface } from '../interface/convert-to-refund-params.interface';
import type { LanguageEnum, TransactionEntryEntityInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class RefundConsolidationService extends Context.Service<RefundConsolidationService>()(
    '@budgie/consolidation/RefundConsolidationService',
    {
        make: Effect.gen(function* () {
            const refundPairRepository = yield* RefundPairRepository;
            const transactionRepository = yield* TransactionRepository;
            const transactionConsolidationRepository = yield* TransactionConsolidationRepository;
            const transactionEntryRepository = yield* TransactionEntryRepository;
            const transactionTagsRepository = yield* TransactionTagsRepository;
            const accountRepository = yield* AccountRepository;
            const debtEventRepository = yield* DebtEventRepository;

            const isAlreadyConsolidated = (
                refundIncomeTransaction: TransactionWithEntriesEntityInterface,
                expenseTransaction: TransactionWithEntriesEntityInterface
            ): boolean =>
                (isDefined(expenseTransaction.consolidationType) &&
                    expenseTransaction.consolidationType !== TransactionConsolidationTypeEnum.REFUND) ||
                isDefined(expenseTransaction.consolidationParentTransactionId) ||
                isDefined(refundIncomeTransaction.consolidationType) ||
                isDefined(refundIncomeTransaction.consolidationParentTransactionId) ||
                refundIncomeTransaction.entries.some(entry => isDefined(entry.originalTransactionId));

            const findEntryByType = (
                entries: TransactionEntryEntityInterface[],
                type: TransactionEntryTypeEnum
            ): TransactionEntryEntityInterface | null =>
                entries.find(entry => entry.type === type && !isDefined(entry.originalTransactionId)) ?? null;

            const getAbsorbedRefundEntries = (entries: TransactionEntryEntityInterface[]): TransactionEntryEntityInterface[] =>
                entries.filter(entry => isDefined(entry.originalTransactionId) && entry.type === TransactionEntryTypeEnum.DEBIT);

            const validateMatchingCurrency = Effect.fnUntraced(function* (expenseAccountId: number, refundAccountId: number) {
                if (expenseAccountId === refundAccountId) {
                    return;
                }

                const accounts = yield* accountRepository.findByIds([expenseAccountId, refundAccountId]);
                const expenseAccount = accounts.find(account => account.id === expenseAccountId);
                const refundAccount = accounts.find(account => account.id === refundAccountId);

                if (!isDefined(expenseAccount) || !isDefined(refundAccount)) {
                    return yield* RefundTransactionNotFoundError.make();
                }

                if (expenseAccount.instrumentId !== refundAccount.instrumentId) {
                    return yield* RefundNotFromIncomeError.make();
                }
            });

            const validateRefundCapacity = Effect.fnUntraced(function* (
                refundIncomeTransaction: TransactionWithEntriesEntityInterface,
                expenseTransaction: TransactionWithEntriesEntityInterface,
                refundIncomeEntry: TransactionEntryEntityInterface,
                expenseEntry: TransactionEntryEntityInterface
            ) {
                const absorbedEntries = getAbsorbedRefundEntries(expenseTransaction.entries);
                const absorbedSourceIds = absorbedEntries.map(entry => entry.originalTransactionId).filter(isDefined);
                const absorbedSources = isNotEmptyArray(absorbedSourceIds) ? yield* transactionRepository.findByIds(absorbedSourceIds) : [];
                const absorbedSourcesById = new Map(absorbedSources.map(source => [source.id, source]));

                if (
                    isPrivatbankClosedByAbsorbedRefunds(
                        absorbedEntries,
                        absorbedSourcesById,
                        expenseTransaction.externalSource ?? null,
                        expenseEntry
                    )
                ) {
                    return yield* RefundExceedsExpenseError.make();
                }

                const { feeAmount, absorbedFeeTotal, absorbedPrincipalTotal, isRejectedFeeTitle } = computeRefundCapacityUsage({
                    expenseEntries: expenseTransaction.entries,
                    expenseAccountId: expenseEntry.accountId,
                    absorbedEntries,
                    absorbedSourceById: absorbedSourcesById,
                    incomingTitle: refundIncomeTransaction.title
                });

                const isPrivatbankFullRefund =
                    absorbedPrincipalTotal === 0 &&
                    !isRejectedFeeTitle &&
                    isPrivatbankSameOriginalAmount(
                        refundIncomeTransaction.externalSource ?? null,
                        refundIncomeEntry,
                        expenseTransaction.externalSource ?? null,
                        expenseEntry
                    );
                const fitsFeePool =
                    isRejectedFeeTitle && isPositiveNumber(feeAmount) && refundIncomeEntry.amount + absorbedFeeTotal <= feeAmount;
                const fitsPrincipalPool =
                    refundIncomeEntry.amount + absorbedPrincipalTotal <= expenseEntry.amount || isPrivatbankFullRefund;

                if (!fitsFeePool && !fitsPrincipalPool) {
                    return yield* RefundExceedsExpenseError.make();
                }
            });

            const validateRefundIncomePair = Effect.fnUntraced(function* (
                refundIncomeTransaction: TransactionWithEntriesEntityInterface,
                expenseTransaction: TransactionWithEntriesEntityInterface
            ) {
                if (
                    refundIncomeTransaction.type !== TransactionTypeEnum.INCOME ||
                    expenseTransaction.type !== TransactionTypeEnum.EXPENSE
                ) {
                    return yield* RefundNotFromIncomeError.make();
                }

                if (isAlreadyConsolidated(refundIncomeTransaction, expenseTransaction)) {
                    return yield* RefundAlreadyConsolidatedError.make();
                }

                const activeDebtEvent = yield* debtEventRepository.findByTransactionId(refundIncomeTransaction.id);

                if (isDefined(activeDebtEvent)) {
                    return yield* RefundAlreadyConsolidatedError.make();
                }

                const expenseEntry = findEntryByType(expenseTransaction.entries, TransactionEntryTypeEnum.CREDIT);
                const [refundIncomeEntry, ...siblingRefundEntries] = refundIncomeTransaction.entries;

                if (!isDefined(expenseEntry) || !isDefined(refundIncomeEntry)) {
                    return yield* RefundTransactionNotFoundError.make();
                }

                if (
                    !isEmptyArray(siblingRefundEntries) ||
                    refundIncomeEntry.type !== TransactionEntryTypeEnum.DEBIT ||
                    !isPositiveNumber(refundIncomeEntry.amount)
                ) {
                    return yield* RefundNotFromIncomeError.make();
                }

                yield* validateMatchingCurrency(expenseEntry.accountId, refundIncomeEntry.accountId);
                yield* validateRefundCapacity(refundIncomeTransaction, expenseTransaction, refundIncomeEntry, expenseEntry);
            });

            return {
                findRefundableExpenses: Effect.fn('RefundConsolidationService.findRefundableExpenses')(function* (
                    refundIncomeTransactionId: number,
                    search: string,
                    language: LanguageEnum
                ) {
                    return yield* refundPairRepository.findRefundableExpenseCandidates(refundIncomeTransactionId, search, language);
                }),
                convertToRefund: Effect.fn('RefundConsolidationService.convertToRefund')(
                    function* (params: ConvertToRefundParamsInterface) {
                        const transactions = yield* transactionRepository.findByIdsWithRefundConsolidationHistory([
                            params.refundIncomeTransactionId,
                            params.expenseTransactionId
                        ]);
                        const refundIncomeTransaction = transactions.find(
                            transaction => transaction.id === params.refundIncomeTransactionId
                        );
                        const expenseTransaction = transactions.find(transaction => transaction.id === params.expenseTransactionId);

                        if (
                            !isDefined(refundIncomeTransaction) ||
                            !isDefined(expenseTransaction) ||
                            isDefined(refundIncomeTransaction.deletedAt) ||
                            isDefined(expenseTransaction.deletedAt)
                        ) {
                            return yield* RefundTransactionNotFoundError.make();
                        }

                        yield* validateRefundIncomePair(refundIncomeTransaction, expenseTransaction);
                        yield* transactionConsolidationRepository.setConsolidationType(
                            expenseTransaction.id,
                            TransactionConsolidationTypeEnum.REFUND
                        );
                        yield* consolidationCopySourceTransactionTags(
                            transactionTagsRepository,
                            [refundIncomeTransaction.id],
                            expenseTransaction.id
                        );
                        yield* transactionEntryRepository.moveToConsolidatedTransaction(
                            [refundIncomeTransaction.id],
                            expenseTransaction.id
                        );
                        yield* transactionConsolidationRepository.setConsolidationParent(
                            [refundIncomeTransaction.id],
                            expenseTransaction.id
                        );

                        return expenseTransaction.id;
                    },
                    effect => Db.transaction(effect)
                )
            };
        })
    }
) {
    static readonly layer = Layer.effect(RefundConsolidationService, RefundConsolidationService.make).pipe(
        Layer.provide([
            RefundPairRepository.layer,
            TransactionRepository.layer,
            TransactionConsolidationRepository.layer,
            TransactionEntryRepository.layer,
            TransactionTagsRepository.layer,
            AccountRepository.layer,
            DebtEventRepository.layer
        ])
    );
}
