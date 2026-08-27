import {
    ExternalSourceEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { insertOne } from '../db/insert-one';

import type { SeedBankPairEntryInputType } from './seed-bank-pair-entry-input.type';
import type {
    TransactionCreateEntityInterface,
    TransactionEntityInterface,
    TransactionEntryCreateEntityInterface
} from '@budgie/contracts';

type SeedBankPairTransactionInputType = Pick<TransactionCreateEntityInterface, 'externalId' | 'operatedAt'>;

type BankPairSide = TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME;

const seedBankSide = (
    type: BankPairSide,
    transaction: SeedBankPairTransactionInputType,
    entry: SeedBankPairEntryInputType
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
        comment: '',
        updatedBy: null
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

const buildSide = (type: BankPairSide) => (transaction: SeedBankPairTransactionInputType, entry: SeedBankPairEntryInputType) =>
    seedBankSide(type, transaction, entry);

export const seedBankPair = {
    expense: buildSide(TransactionTypeEnum.EXPENSE),
    income: buildSide(TransactionTypeEnum.INCOME)
};
