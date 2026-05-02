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

type BankSideInput = Pick<TransactionEntryCreateEntityInterface, 'accountId' | 'amount'> & {
    readonly externalId: string;
    readonly operatedAt: Date;
    readonly mccCategoryId?: number | null;
    readonly exchangeRate?: number;
    readonly toIban?: string | null;
};

interface SeedBankSideShape {
    readonly type: TransactionTypeEnum;
    readonly entryType: TransactionEntryTypeEnum;
    readonly fromAccountId: number | null;
    readonly toAccountId: number | null;
}

const seedBankSide = (input: BankSideInput, shape: SeedBankSideShape): TransactionEntityInterface => {
    const transaction = insertOne(TransactionEntityTable, {
        type: shape.type,
        title: `${shape.type} ${input.externalId}`,
        externalId: input.externalId,
        externalSource: ExternalSourceEnum.MONOBANK,
        operatedAt: input.operatedAt,
        exchangeRate: input.exchangeRate ?? 1,
        fromAccountId: shape.fromAccountId,
        toAccountId: shape.toAccountId,
        comment: ''
    } satisfies TransactionCreateEntityInterface);
    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId: input.accountId,
        type: shape.entryType,
        amount: input.amount,
        externalId: input.externalId,
        exchangeRate: input.exchangeRate ?? 1,
        toIban: input.toIban ?? null,
        categoryId: null,
        mccCategoryId: input.mccCategoryId ?? null,
        originalTransactionId: null
    } satisfies TransactionEntryCreateEntityInterface);
    return transaction;
};

export const seedBankExpense = (input: BankSideInput): TransactionEntityInterface =>
    seedBankSide(input, {
        type: TransactionTypeEnum.EXPENSE,
        entryType: TransactionEntryTypeEnum.CREDIT,
        fromAccountId: input.accountId,
        toAccountId: null
    });

export const seedBankIncome = (input: BankSideInput): TransactionEntityInterface =>
    seedBankSide(input, {
        type: TransactionTypeEnum.INCOME,
        entryType: TransactionEntryTypeEnum.DEBIT,
        fromAccountId: null,
        toAccountId: input.accountId
    });
