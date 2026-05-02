import { TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';

import { insertOne } from './insert-one';

import type { TransactionEntityInterface } from '@budgie/contracts';

interface BankSideInput {
    readonly accountId: number;
    readonly amountMicro: number;
    readonly operatedAt: Date;
    readonly externalId: string;
    readonly counterIban?: string | null;
    readonly mccCategoryId?: number | null;
    readonly exchangeRate?: number;
}

interface SeedBankSideShape {
    readonly type: 'EXPENSE' | 'INCOME';
    readonly entryType: 'CREDIT' | 'DEBIT';
    readonly fromAccountId: number | null;
    readonly toAccountId: number | null;
}

const seedBankSide = (input: BankSideInput, shape: SeedBankSideShape): TransactionEntityInterface => {
    const transaction = insertOne<TransactionEntityInterface>(TransactionEntityTable, {
        type: shape.type,
        title: `${shape.type} ${input.externalId}`,
        externalId: input.externalId,
        externalSource: 'MONOBANK',
        operatedAt: input.operatedAt,
        exchangeRate: input.exchangeRate ?? 1,
        fromAccountId: shape.fromAccountId,
        toAccountId: shape.toAccountId,
        comment: ''
    });
    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId: input.accountId,
        type: shape.entryType,
        amount: input.amountMicro,
        externalId: input.externalId,
        exchangeRate: input.exchangeRate ?? 1,
        toIban: input.counterIban ?? null,
        mccCategoryId: input.mccCategoryId ?? null,
        originalTransactionId: null
    });
    return transaction;
};

export const seedBankExpense = (input: BankSideInput): TransactionEntityInterface =>
    seedBankSide(input, { type: 'EXPENSE', entryType: 'CREDIT', fromAccountId: input.accountId, toAccountId: null });

export const seedBankIncome = (input: BankSideInput): TransactionEntityInterface =>
    seedBankSide(input, { type: 'INCOME', entryType: 'DEBIT', fromAccountId: null, toAccountId: input.accountId });
