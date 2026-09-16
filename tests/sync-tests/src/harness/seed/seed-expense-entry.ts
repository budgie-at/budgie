import { TransactionEntityTable, TransactionEntryEntityTable, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { insertOne } from '../db/insert-one';

export const seedExpenseEntry = (accountId: number, amount: number, title: string): void => {
    const transaction = insertOne(TransactionEntityTable, {
        type: TransactionTypeEnum.EXPENSE,
        title,
        externalId: null,
        comment: '',
        toAccountId: null,
        fromAccountId: accountId,
        exchangeRate: 1,
        externalSource: null,
        updatedBy: null,
        needsEmbedding: false
    });

    insertOne(TransactionEntryEntityTable, {
        transactionId: transaction.id,
        accountId,
        type: TransactionEntryTypeEnum.CREDIT,
        amount,
        categoryId: null,
        mccCategoryId: null,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: null,
        baseExchangeRate: null,
        baseAmount: null,
        toIban: null,
        originalTransactionId: null
    });
};
