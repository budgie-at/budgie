import {
    ExternalSourceEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { insertOne } from '../db/insert-one';

import type {
    TransactionCreateEntityInterface,
    TransactionEntityInterface,
    TransactionEntryCreateEntityInterface
} from '@budgie/contracts';

interface SeedRefundedExpenseInput {
    readonly accountId: number;
    readonly refundAccountId?: number;
    readonly expenseAmount: number;
    readonly refundAmounts: readonly number[];
    readonly title?: string;
    readonly mccCategoryId?: number | null;
    readonly refundTitle?: string;
    readonly refundMccCategoryId?: number | null;
    readonly expenseOperatedAt?: Date;
    readonly refundDelaySeconds?: number;
    readonly externalIdPrefix?: string;
}

interface SeedRefundedExpenseResult {
    readonly expense: TransactionEntityInterface;
    readonly refunds: TransactionEntityInterface[];
}

const DEFAULT_TITLE = 'STARBUCKS #1234';
const DEFAULT_DELAY_SECONDS = 86_400;
const DEFAULT_OPERATED_AT = new Date(2026, 0, 15, 12, 0, 0);

export const seedRefundedExpense = (input: SeedRefundedExpenseInput): SeedRefundedExpenseResult => {
    const title = input.title ?? DEFAULT_TITLE;
    const refundTitle = input.refundTitle ?? title;
    const refundAccountId = input.refundAccountId ?? input.accountId;
    const expenseOperatedAt = input.expenseOperatedAt ?? DEFAULT_OPERATED_AT;
    const refundDelaySeconds = input.refundDelaySeconds ?? DEFAULT_DELAY_SECONDS;
    const externalIdPrefix = input.externalIdPrefix ?? 'rf';

    const expense = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title,
        externalId: `${externalIdPrefix}-expense`,
        externalSource: ExternalSourceEnum.MONOBANK,
        operatedAt: expenseOperatedAt,
        exchangeRate: 1,
        fromAccountId: input.accountId,
        toAccountId: null,
        comment: '',
        updatedBy: null
    } satisfies TransactionCreateEntityInterface);

    insertOne(TransactionEntryEntityTable, {
        transactionId: expense.id,
        accountId: input.accountId,
        type: TransactionEntryTypeEnum.CREDIT,
        amount: input.expenseAmount,
        externalId: `${externalIdPrefix}-expense`,
        exchangeRate: 1,
        toIban: null,
        categoryId: null,
        mccCategoryId: input.mccCategoryId ?? null,
        originalTransactionId: null
    } satisfies TransactionEntryCreateEntityInterface);

    const refunds = input.refundAmounts.map((refundAmount, index) => {
        const operatedAt = new Date(expenseOperatedAt.getTime() + refundDelaySeconds * 1000 * (index + 1));

        const refund = insertOne(TransactionEntityTable, {
            type: TransactionTypeEnum.INCOME,
            title: refundTitle,
            externalId: `${externalIdPrefix}-refund-${index}`,
            externalSource: ExternalSourceEnum.MONOBANK,
            operatedAt,
            exchangeRate: 1,
            fromAccountId: null,
            toAccountId: refundAccountId,
            comment: '',
            updatedBy: null
        } satisfies TransactionCreateEntityInterface);

        insertOne(TransactionEntryEntityTable, {
            transactionId: refund.id,
            accountId: refundAccountId,
            type: TransactionEntryTypeEnum.DEBIT,
            amount: refundAmount,
            externalId: `${externalIdPrefix}-refund-${index}`,
            exchangeRate: 1,
            toIban: null,
            categoryId: null,
            mccCategoryId: input.refundMccCategoryId ?? input.mccCategoryId ?? null,
            originalTransactionId: null
        } satisfies TransactionEntryCreateEntityInterface);

        return refund;
    });

    return { expense, refunds };
};
