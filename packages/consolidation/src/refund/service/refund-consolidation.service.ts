import { TransactionConsolidationTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { consolidationCopySourceTransactionTags } from '../../shared/utils/consolidation-copy-source-transaction-tags.util';

import type { ConvertToRefundParamsInterface } from '../interface/convert-to-refund-params.interface';
import type { RefundConsolidationDependenciesInterface } from '../interface/refund-consolidation-dependencies.interface';
import type {
    DB,
    RefundableExpenseCandidateInterface,
    TransactionEntryEntityInterface,
    TransactionWithEntriesEntityInterface
} from '@budgie/contracts';

export class RefundConsolidationService {
    private static readonly LOG_PREVIEW_LENGTH = 16;

    constructor(private readonly dependencies: RefundConsolidationDependenciesInterface) {}

    @Log(
        (refundIncomeTransactionId, search) =>
            `enter refundIncomeTransactionId=${refundIncomeTransactionId} searchPreview="${search.slice(0, RefundConsolidationService.LOG_PREVIEW_LENGTH)}" searchLen=${search.length}`,
        (result, refundIncomeTransactionId, search) =>
            `done refundIncomeTransactionId=${refundIncomeTransactionId} searchPreview="${search.slice(0, RefundConsolidationService.LOG_PREVIEW_LENGTH)}" searchLen=${search.length} candidateIds=${result.map(candidate => candidate.id).join(',')}`,
        (error, refundIncomeTransactionId, search) =>
            `throw refundIncomeTransactionId=${refundIncomeTransactionId} searchPreview="${search.slice(0, RefundConsolidationService.LOG_PREVIEW_LENGTH)}" searchLen=${search.length} error=${getErrorMessage(error)}`
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
        return await this.dependencies.runTransaction(this.dependencies.database, async tx => this.convertToRefundInner(params, tx));
    }

    private async convertToRefundInner(params: ConvertToRefundParamsInterface, tx: DB): Promise<number> {
        const transactions = await this.dependencies.transactionRepository.findByIdsWithRefundConsolidationHistory(
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
        await consolidationCopySourceTransactionTags(
            this.dependencies.transactionTagsRepository,
            [refundIncomeTransaction.id],
            expenseTransaction.id,
            tx
        );
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
}
