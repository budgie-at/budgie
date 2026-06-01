import { TransactionConsolidationTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined, isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import type { ConvertToRefundParamsInterface } from '../interface/convert-to-refund-params.interface';
import type { RefundConsolidationDependenciesInterface } from '../interface/refund-consolidation-dependencies.interface';
import type {
    DB,
    RefundableExpenseCandidateInterface,
    TransactionEntryEntityInterface,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';

export class RefundConsolidationService {
    constructor(private readonly dependencies: RefundConsolidationDependenciesInterface) {}

    @Log(
        (refundIncomeTransactionId, search) => `enter refundIncomeTransactionId=${refundIncomeTransactionId} search="${search}"`,
        (result, refundIncomeTransactionId, search) =>
            `done refundIncomeTransactionId=${refundIncomeTransactionId} search="${search}" candidateIds=${result.map(candidate => candidate.id).join(',')}`,
        (error, refundIncomeTransactionId, search) =>
            `throw refundIncomeTransactionId=${refundIncomeTransactionId} search="${search}" error=${getErrorMessage(error)}`
    )
    async findRefundableExpenses(refundIncomeTransactionId: number, search: string): Promise<RefundableExpenseCandidateInterface[]> {
        return await this.dependencies.refundPairRepository.findRefundableExpenseCandidates(refundIncomeTransactionId, search);
    }

    @Log(
        params => `enter refundIncomeTransactionId=${params.refundIncomeTransactionId} expenseTransactionId=${params.expenseTransactionId}`,
        (result, params) =>
            `done refundIncomeTransactionId=${params.refundIncomeTransactionId} expenseTransactionId=${params.expenseTransactionId} canonicalTransactionId=${result}`,
        (error, params) =>
            `throw refundIncomeTransactionId=${params.refundIncomeTransactionId} expenseTransactionId=${params.expenseTransactionId} error=${getErrorMessage(error)}`
    )
    async convertToRefund(params: ConvertToRefundParamsInterface): Promise<number> {
        return await this.dependencies.transactionRunner.run(this.dependencies.database, async tx => this.convertToRefundInner(params, tx));
    }

    private async convertToRefundInner(params: ConvertToRefundParamsInterface, tx: DB): Promise<number> {
        const transactions = await this.dependencies.transactionRepository.findByIds(
            [params.refundIncomeTransactionId, params.expenseTransactionId],
            tx
        );
        const refundIncomeTransaction = this.findTransactionOrThrow(transactions, params.refundIncomeTransactionId);
        const expenseTransaction = this.findTransactionOrThrow(transactions, params.expenseTransactionId);

        this.validateRefundIncomePair(refundIncomeTransaction, expenseTransaction);
        await this.dependencies.transactionRepository.setConsolidationType(
            expenseTransaction.id,
            TransactionConsolidationTypeEnum.REFUND,
            tx
        );
        await this.copySourceTags([refundIncomeTransaction.id], expenseTransaction.id, tx);
        await this.dependencies.transactionEntryRepository.moveToConsolidatedTransaction(
            [refundIncomeTransaction.id],
            expenseTransaction.id,
            tx
        );
        await this.dependencies.transactionRepository.setConsolidationParent([refundIncomeTransaction.id], expenseTransaction.id, tx);

        return expenseTransaction.id;
    }

    private findTransactionOrThrow(
        transactions: TransactionWithEntriesEntityInterface[],
        id: number
    ): TransactionWithEntriesEntityInterface {
        const transaction = transactions.find(item => item.id === id);

        if (isDefined(transaction)) {
            return transaction;
        }

        throw new Error('Transaction not found');
    }

    private validateRefundIncomePair(
        refundIncomeTransaction: TransactionWithEntriesEntityInterface,
        expenseTransaction: TransactionWithEntriesEntityInterface
    ): void {
        const expenseEntry = this.findEntryByType(expenseTransaction.entries, TransactionEntryTypeEnum.CREDIT);
        const refundIncomeEntry = this.findEntryByType(refundIncomeTransaction.entries, TransactionEntryTypeEnum.DEBIT);

        if (refundIncomeTransaction.type !== TransactionTypeEnum.INCOME || expenseTransaction.type !== TransactionTypeEnum.EXPENSE) {
            throw new Error('Refund conversion starts from an income');
        }

        if (this.isAlreadyConsolidated(refundIncomeTransaction, expenseTransaction)) {
            throw new Error('Selected transaction is already consolidated');
        }

        if (!isDefined(expenseEntry) || !isDefined(refundIncomeEntry)) {
            throw new Error('Transaction not found');
        }

        if (refundIncomeEntry.amount + this.getExistingRefundAmount(expenseTransaction.entries) > expenseEntry.amount) {
            throw new Error('Refund amount cannot exceed the expense');
        }
    }

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

    private async copySourceTags(sourceTransactionIds: number[], canonicalTransactionId: number, tx: DB): Promise<void> {
        if (isEmptyArray(sourceTransactionIds)) {
            return;
        }

        const sourceTags = await Promise.all(
            sourceTransactionIds.map(async sourceTransactionId =>
                this.dependencies.transactionTagsRepository.findByTransactionId(sourceTransactionId, tx)
            )
        );
        const uniqueTagIds = [...new Set(sourceTags.flat().map(tag => tag.tagId))];
        const existingTags = await this.dependencies.transactionTagsRepository.findByTransactionId(canonicalTransactionId, tx);
        const existingTagIds = new Set(existingTags.map(tag => tag.tagId));
        const missingTagIds = uniqueTagIds.filter(tagId => !existingTagIds.has(tagId));

        if (!isNotEmptyArray(missingTagIds)) {
            return;
        }

        await this.dependencies.transactionTagsRepository.bulkCreate(
            missingTagIds.map(tagId => ({
                transactionId: canonicalTransactionId,
                tagId,
                isPrimary: false
            })),
            tx
        );
    }
}
