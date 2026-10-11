import {
    Db,
    PRECISION,
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

import { isDefined } from '@rnw-community/shared';

import { RefundPairRepository } from '../../query/repository/refund-pair.repository';
import { REFUND_ORIGINAL_CURRENCY_RATE_TOLERANCE } from '../../shared/constant/refund-original-currency-rate-tolerance.constant';
import { consolidationCopySourceTransactionTags } from '../../shared/utils/consolidation-copy-source-transaction-tags.util';
import { RefundAlreadyConsolidatedError } from '../error/refund-already-consolidated.error';
import { RefundExceedsExpenseError } from '../error/refund-exceeds-expense.error';
import { RefundNotFromIncomeError } from '../error/refund-not-from-income.error';
import { RefundTransactionNotFoundError } from '../error/refund-transaction-not-found.error';

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

            const isAlreadyConsolidated = (
                refundIncomeTransaction: TransactionWithEntriesEntityInterface,
                expenseTransaction: TransactionWithEntriesEntityInterface
            ): boolean =>
                (isDefined(expenseTransaction.consolidationType) &&
                    expenseTransaction.consolidationType !== TransactionConsolidationTypeEnum.REFUND) ||
                isDefined(refundIncomeTransaction.consolidationType) ||
                isDefined(refundIncomeTransaction.consolidationParentTransactionId);

            const findEntryByType = (
                entries: TransactionEntryEntityInterface[],
                type: TransactionEntryTypeEnum
            ): TransactionEntryEntityInterface | null =>
                entries.find(entry => entry.type === type && !isDefined(entry.originalTransactionId)) ?? null;

            const getExistingRefundAmount = (entries: TransactionEntryEntityInterface[]): number =>
                entries
                    .filter(entry => isDefined(entry.originalTransactionId) && entry.type === TransactionEntryTypeEnum.DEBIT)
                    .reduce((total, entry) => total + entry.amount, 0);

            const getOriginalMinorAmount = (entry: TransactionEntryEntityInterface): number =>
                Math.round(entry.amount / entry.exchangeRate / (PRECISION / 100));

            const isSameOriginalCurrency = (
                refundIncomeEntry: TransactionEntryEntityInterface,
                expenseEntry: TransactionEntryEntityInterface
            ): boolean =>
                (!isDefined(refundIncomeEntry.operationInstrumentId) ||
                    !isDefined(expenseEntry.operationInstrumentId) ||
                    refundIncomeEntry.operationInstrumentId === expenseEntry.operationInstrumentId) &&
                Math.abs(refundIncomeEntry.exchangeRate / expenseEntry.exchangeRate - 1) <= REFUND_ORIGINAL_CURRENCY_RATE_TOLERANCE;

            const isForeignCurrencyFullRefund = (
                refundIncomeEntry: TransactionEntryEntityInterface,
                expenseEntry: TransactionEntryEntityInterface,
                existingRefundAmount: number
            ): boolean =>
                existingRefundAmount === 0 &&
                refundIncomeEntry.exchangeRate !== 1 &&
                expenseEntry.exchangeRate !== 1 &&
                isSameOriginalCurrency(refundIncomeEntry, expenseEntry) &&
                getOriginalMinorAmount(refundIncomeEntry) === getOriginalMinorAmount(expenseEntry);

            const validateRefundIncomePair = Effect.fnUntraced(function* (
                refundIncomeTransaction: TransactionWithEntriesEntityInterface,
                expenseTransaction: TransactionWithEntriesEntityInterface
            ) {
                const expenseEntry = findEntryByType(expenseTransaction.entries, TransactionEntryTypeEnum.CREDIT);
                const refundIncomeEntry = findEntryByType(refundIncomeTransaction.entries, TransactionEntryTypeEnum.DEBIT);

                if (
                    refundIncomeTransaction.type !== TransactionTypeEnum.INCOME ||
                    expenseTransaction.type !== TransactionTypeEnum.EXPENSE
                ) {
                    return yield* new RefundNotFromIncomeError();
                }

                if (isAlreadyConsolidated(refundIncomeTransaction, expenseTransaction)) {
                    return yield* new RefundAlreadyConsolidatedError();
                }

                if (!isDefined(expenseEntry) || !isDefined(refundIncomeEntry)) {
                    return yield* new RefundTransactionNotFoundError();
                }

                const existingRefundAmount = getExistingRefundAmount(expenseTransaction.entries);

                if (
                    refundIncomeEntry.amount + existingRefundAmount > expenseEntry.amount &&
                    !isForeignCurrencyFullRefund(refundIncomeEntry, expenseEntry, existingRefundAmount)
                ) {
                    return yield* new RefundExceedsExpenseError();
                }

                return yield* Effect.void;
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

                        if (!isDefined(refundIncomeTransaction) || !isDefined(expenseTransaction)) {
                            return yield* new RefundTransactionNotFoundError();
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
            TransactionTagsRepository.layer
        ])
    );
}
