import { TransactionConsolidationTypeEnum, TransactionTypeEnum, transactionAsync } from '@budgie/contracts';
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
import type { DB, RefundMatchCandidateInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

class TransactionRefundService {
    async findCandidates(transactionId: number, search: string): Promise<RefundMatchCandidateInterface[]> {
        return await refundPairRepository.findManualCandidates(transactionId, search);
    }

    async convertToRefund(params: ConvertToRefundParamsInterface): Promise<number> {
        return await transactionAsync(db, async tx => {
            const transactions = await transactionRepository.findByIds([params.transactionId, params.refundTransactionId], tx);
            const sourceTransaction = this.findTransactionOrThrow(transactions, params.transactionId);
            const selectedTransaction = this.findTransactionOrThrow(transactions, params.refundTransactionId);
            const canonicalTransaction = this.resolveCanonicalTransaction(sourceTransaction, selectedTransaction);
            const movedTransaction = canonicalTransaction.id === sourceTransaction.id ? selectedTransaction : sourceTransaction;

            this.validateRefundPair(canonicalTransaction, movedTransaction);
            await transactionRepository.setConsolidationType(canonicalTransaction.id, TransactionConsolidationTypeEnum.REFUND, tx);
            await this.copySourceTags([movedTransaction.id], canonicalTransaction.id, tx);
            await transactionEntryRepository.moveToConsolidatedTransaction([movedTransaction.id], canonicalTransaction.id, tx);
            await transactionRepository.setConsolidationParent([movedTransaction.id], canonicalTransaction.id, tx);

            return canonicalTransaction.id;
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

    private resolveCanonicalTransaction(
        sourceTransaction: TransactionWithEntriesEntityInterface,
        selectedTransaction: TransactionWithEntriesEntityInterface
    ): TransactionWithEntriesEntityInterface {
        if (sourceTransaction.type === TransactionTypeEnum.EXPENSE && selectedTransaction.type === TransactionTypeEnum.INCOME) {
            return sourceTransaction;
        }

        if (sourceTransaction.type === TransactionTypeEnum.INCOME && selectedTransaction.type === TransactionTypeEnum.EXPENSE) {
            return selectedTransaction;
        }

        throw new Error(t`Select an opposite transaction type`);
    }

    private validateRefundPair(
        canonicalTransaction: TransactionWithEntriesEntityInterface,
        movedTransaction: TransactionWithEntriesEntityInterface
    ): void {
        const [canonicalEntry] = canonicalTransaction.entries;
        const [movedEntry] = movedTransaction.entries;
        const isRefundCanonical =
            !isDefined(canonicalTransaction.consolidationType) ||
            canonicalTransaction.consolidationType === TransactionConsolidationTypeEnum.REFUND;
        const isMovedTransactionConsolidated =
            isDefined(movedTransaction.consolidationType) || isDefined(movedTransaction.consolidationParentTransactionId);

        if (canonicalTransaction.type !== TransactionTypeEnum.EXPENSE || movedTransaction.type !== TransactionTypeEnum.INCOME) {
            throw new Error(t`Refunds must connect an expense and an income`);
        }

        if (!isRefundCanonical || isMovedTransactionConsolidated) {
            throw new Error(t`Selected transaction is already consolidated`);
        }

        if (!isDefined(canonicalEntry) || !isDefined(movedEntry)) {
            throw new Error(t`Transaction not found`);
        }

        if (movedEntry.amount > canonicalEntry.amount) {
            throw new Error(t`Refund amount cannot exceed the expense`);
        }
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
