import { TransactionConsolidationTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum, transactionAsync } from '@budgie/contracts';
import { t } from '@lingui/core/macro';

import { isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import {
    db,
    refundPairRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';

import type { ConvertToRefundParamsInterface } from '../interface/convert-to-refund-params.interface';
import type {
    DB,
    RefundableExpenseCandidateInterface,
    TransactionEntryEntityInterface,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';

class TransactionRefundService {
    async findRefundableExpenses(refundIncomeTransactionId: number, search: string): Promise<RefundableExpenseCandidateInterface[]> {
        return await refundPairRepository.findRefundableExpenseCandidates(refundIncomeTransactionId, search);
    }

    async convertToRefund(params: ConvertToRefundParamsInterface): Promise<number> {
        return await transactionAsync(db, async tx => {
            const transactions = await transactionRepository.findByIds([params.refundIncomeTransactionId, params.expenseTransactionId], tx);
            const refundIncomeTransaction = this.findTransactionOrThrow(transactions, params.refundIncomeTransactionId);
            const expenseTransaction = this.findTransactionOrThrow(transactions, params.expenseTransactionId);

            this.validateRefundIncomePair(refundIncomeTransaction, expenseTransaction);
            await transactionRepository.setConsolidationType(expenseTransaction.id, TransactionConsolidationTypeEnum.REFUND, tx);
            await this.copySourceTags([refundIncomeTransaction.id], expenseTransaction.id, tx);
            await transactionEntryRepository.moveToConsolidatedTransaction([refundIncomeTransaction.id], expenseTransaction.id, tx);
            await transactionRepository.setConsolidationParent([refundIncomeTransaction.id], expenseTransaction.id, tx);

            return expenseTransaction.id;
        });
    }

    private findTransactionOrThrow(
        transactions: TransactionWithEntriesEntityInterface[],
        id: number
    ): TransactionWithEntriesEntityInterface {
        const transaction = transactions.find(item => item.id === id);

        if (isDefined(transaction)) {
            return transaction;
        }

        throw new Error(t`Transaction not found`);
    }

    private validateRefundIncomePair(
        refundIncomeTransaction: TransactionWithEntriesEntityInterface,
        expenseTransaction: TransactionWithEntriesEntityInterface
    ): void {
        const expenseEntry = this.findEntryByType(expenseTransaction.entries, TransactionEntryTypeEnum.CREDIT);
        const refundIncomeEntry = this.findEntryByType(refundIncomeTransaction.entries, TransactionEntryTypeEnum.DEBIT);

        if (refundIncomeTransaction.type !== TransactionTypeEnum.INCOME || expenseTransaction.type !== TransactionTypeEnum.EXPENSE) {
            throw new Error(t`Refund conversion starts from an income`);
        }

        if (
            (isDefined(expenseTransaction.consolidationType) &&
                expenseTransaction.consolidationType !== TransactionConsolidationTypeEnum.REFUND) ||
            isDefined(refundIncomeTransaction.consolidationType) ||
            isDefined(refundIncomeTransaction.consolidationParentTransactionId)
        ) {
            throw new Error(t`Selected transaction is already consolidated`);
        }

        if (!isDefined(expenseEntry) || !isDefined(refundIncomeEntry)) {
            throw new Error(t`Transaction not found`);
        }

        if (refundIncomeEntry.amount + this.getExistingRefundAmount(expenseTransaction.entries) > expenseEntry.amount) {
            throw new Error(t`Refund amount cannot exceed the expense`);
        }
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

    private async copySourceTags(sourceTransactionIds: number[], canonicalTransactionId: number, tx: DB): Promise<void> {
        if (isEmptyArray(sourceTransactionIds)) {
            return;
        }

        const sourceTags = await Promise.all(sourceTransactionIds.map(async id => transactionTagsRepository.findByTransactionId(id, tx)));
        const uniqueTagIds = [...new Set(sourceTags.flat().map(tag => tag.tagId))];

        if (!isNotEmptyArray(uniqueTagIds)) {
            return;
        }

        await transactionTagsRepository.bulkCreate(
            uniqueTagIds.map(tagId => ({
                transactionId: canonicalTransactionId,
                tagId,
                isPrimary: false
            })),
            tx
        );
    }
}

export const transactionRefundService = new TransactionRefundService();
