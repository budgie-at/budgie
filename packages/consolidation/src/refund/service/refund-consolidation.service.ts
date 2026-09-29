import { Db, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { consolidationCopySourceTransactionTags } from '../../shared/utils/consolidation-copy-source-transaction-tags.util';
import { RefundAlreadyConsolidatedError } from '../error/refund-already-consolidated.error';
import { RefundExceedsExpenseError } from '../error/refund-exceeds-expense.error';
import { RefundNotFromIncomeError } from '../error/refund-not-from-income.error';
import { RefundTransactionNotFoundError } from '../error/refund-transaction-not-found.error';

import type { ConvertToRefundParamsInterface } from '../interface/convert-to-refund-params.interface';
import type { RefundConsolidationDependenciesInterface } from '../interface/refund-consolidation-dependencies.interface';
import type { LanguageEnum, TransactionEntryEntityInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class RefundConsolidationService {
    readonly findRefundableExpenses = Effect.fn('RefundConsolidationService.findRefundableExpenses')(function* (
        this: RefundConsolidationService,
        refundIncomeTransactionId: number,
        search: string,
        language: LanguageEnum
    ) {
        return yield* this.dependencies.refundPairRepository.findRefundableExpenseCandidates(refundIncomeTransactionId, search, language);
    });

    readonly convertToRefund = Effect.fn('RefundConsolidationService.convertToRefund')(
        function* (this: RefundConsolidationService, params: ConvertToRefundParamsInterface) {
            const transactions = yield* this.dependencies.transactionRepository.findByIdsWithRefundConsolidationHistory([
                params.refundIncomeTransactionId,
                params.expenseTransactionId
            ]);
            const refundIncomeTransaction = transactions.find(transaction => transaction.id === params.refundIncomeTransactionId);
            const expenseTransaction = transactions.find(transaction => transaction.id === params.expenseTransactionId);

            if (!isDefined(refundIncomeTransaction) || !isDefined(expenseTransaction)) {
                return yield* new RefundTransactionNotFoundError();
            }

            yield* this.validateRefundIncomePair(refundIncomeTransaction, expenseTransaction);
            yield* this.dependencies.transactionRepository.setConsolidationType(
                expenseTransaction.id,
                TransactionConsolidationTypeEnum.REFUND
            );
            yield* consolidationCopySourceTransactionTags(
                this.dependencies.transactionTagsRepository,
                [refundIncomeTransaction.id],
                expenseTransaction.id
            );
            yield* this.dependencies.transactionEntryRepository.moveToConsolidatedTransaction(
                [refundIncomeTransaction.id],
                expenseTransaction.id
            );
            yield* this.dependencies.transactionRepository.setConsolidationParent([refundIncomeTransaction.id], expenseTransaction.id);

            return expenseTransaction.id;
        },
        effect => Db.transaction(effect)
    );

    private readonly validateRefundIncomePair = Effect.fnUntraced(function* (
        this: RefundConsolidationService,
        refundIncomeTransaction: TransactionWithEntriesEntityInterface,
        expenseTransaction: TransactionWithEntriesEntityInterface
    ) {
        const expenseEntry = this.findEntryByType(expenseTransaction.entries, TransactionEntryTypeEnum.CREDIT);
        const refundIncomeEntry = this.findEntryByType(refundIncomeTransaction.entries, TransactionEntryTypeEnum.DEBIT);

        if (refundIncomeTransaction.type !== TransactionTypeEnum.INCOME || expenseTransaction.type !== TransactionTypeEnum.EXPENSE) {
            return yield* new RefundNotFromIncomeError();
        }

        if (this.isAlreadyConsolidated(refundIncomeTransaction, expenseTransaction)) {
            return yield* new RefundAlreadyConsolidatedError();
        }

        if (!isDefined(expenseEntry) || !isDefined(refundIncomeEntry)) {
            return yield* new RefundTransactionNotFoundError();
        }

        if (refundIncomeEntry.amount + this.getExistingRefundAmount(expenseTransaction.entries) > expenseEntry.amount) {
            return yield* new RefundExceedsExpenseError();
        }

        return yield* Effect.void;
    });

    constructor(private readonly dependencies: RefundConsolidationDependenciesInterface) {}

    private isAlreadyConsolidated(
        refundIncomeTransaction: TransactionWithEntriesEntityInterface,
        expenseTransaction: TransactionWithEntriesEntityInterface
    ): boolean {
        return (
            (isDefined(expenseTransaction.consolidationType) &&
                expenseTransaction.consolidationType !== TransactionConsolidationTypeEnum.REFUND) ||
            isDefined(refundIncomeTransaction.consolidationType) ||
            isDefined(refundIncomeTransaction.consolidationParentTransactionId)
        );
    }

    private findEntryByType(
        entries: TransactionEntryEntityInterface[],
        type: TransactionEntryTypeEnum
    ): TransactionEntryEntityInterface | null {
        return entries.find(entry => entry.type === type && !isDefined(entry.originalTransactionId)) ?? null;
    }

    private getExistingRefundAmount(entries: TransactionEntryEntityInterface[]): number {
        return entries
            .filter(entry => isDefined(entry.originalTransactionId) && entry.type === TransactionEntryTypeEnum.DEBIT)
            .reduce((total, entry) => total + entry.amount, 0);
    }
}
