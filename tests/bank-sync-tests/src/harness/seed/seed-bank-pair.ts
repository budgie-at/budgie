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

const seedBankSide = (
    type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME,
    transaction: Pick<TransactionCreateEntityInterface, 'externalId' | 'operatedAt'>,
    entry: Pick<TransactionEntryCreateEntityInterface, 'accountId' | 'amount'> & {
        readonly mccCategoryId?: number | null;
        readonly exchangeRate?: number;
        readonly toIban?: string | null;
    }
): TransactionEntityInterface => {
    const entryType = type === TransactionTypeEnum.EXPENSE ? TransactionEntryTypeEnum.CREDIT : TransactionEntryTypeEnum.DEBIT;
    const fromAccountId = type === TransactionTypeEnum.EXPENSE ? entry.accountId : null;
    const toAccountId = type === TransactionTypeEnum.INCOME ? entry.accountId : null;
    const inserted = insertOne(TransactionEntityTable, {
        type,
        title: `${type} ${transaction.externalId}`,
        externalId: transaction.externalId,
        externalSource: ExternalSourceEnum.MONOBANK,
        operatedAt: transaction.operatedAt,
        exchangeRate: entry.exchangeRate ?? 1,
        fromAccountId,
        toAccountId,
        comment: ''
    } satisfies TransactionCreateEntityInterface);
    insertOne(TransactionEntryEntityTable, {
        transactionId: inserted.id,
        accountId: entry.accountId,
        type: entryType,
        amount: entry.amount,
        externalId: transaction.externalId,
        exchangeRate: entry.exchangeRate ?? 1,
        toIban: entry.toIban ?? null,
        categoryId: null,
        mccCategoryId: entry.mccCategoryId ?? null,
        originalTransactionId: null
    } satisfies TransactionEntryCreateEntityInterface);
    return inserted;
};

export const seedBankPair = {
    expense: (
        transaction: Pick<TransactionCreateEntityInterface, 'externalId' | 'operatedAt'>,
        entry: Pick<TransactionEntryCreateEntityInterface, 'accountId' | 'amount'> & {
            readonly mccCategoryId?: number | null;
            readonly exchangeRate?: number;
            readonly toIban?: string | null;
        }
    ): TransactionEntityInterface => seedBankSide(TransactionTypeEnum.EXPENSE, transaction, entry),
    income: (
        transaction: Pick<TransactionCreateEntityInterface, 'externalId' | 'operatedAt'>,
        entry: Pick<TransactionEntryCreateEntityInterface, 'accountId' | 'amount'> & {
            readonly mccCategoryId?: number | null;
            readonly exchangeRate?: number;
            readonly toIban?: string | null;
        }
    ): TransactionEntityInterface => seedBankSide(TransactionTypeEnum.INCOME, transaction, entry)
};
