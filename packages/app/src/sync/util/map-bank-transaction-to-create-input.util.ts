import { BankTransactionInterface, BankTransactionTypeEnum } from '@budgie/bank-sync';
import { ExternalSourceEnum, TransactionCreateInputInterface, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

export const mapBankTransactionToCreateInput = (
    bankTransaction: BankTransactionInterface,
    accountId: number,
    mccCategoryId: number | null,
    provider: ExternalSourceEnum
): TransactionCreateInputInterface => {
    const isIncome = bankTransaction.type === BankTransactionTypeEnum.INCOME;
    const amount = Math.abs(bankTransaction.amount);
    const operationAmount = Math.abs(bankTransaction.operationAmount);
    const entryType = isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT;

    const exchangeRate = isPositiveNumber(operationAmount) && amount !== operationAmount ? amount / operationAmount : 1;

    return {
        amount,
        title: bankTransaction.description,
        comment: bankTransaction.comment ?? '',
        type: isIncome ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE,
        exchangeRate,
        operatedAt: new Date(bankTransaction.time * 1000),
        externalId: bankTransaction.id,
        updatedBy: null,
        externalSource: provider,
        fromAccountId: isIncome ? null : accountId,
        toAccountId: isIncome ? accountId : null,
        tagIds: [],
        entries: [
            {
                accountId,
                type: entryType,
                amount,
                categoryId: null,
                mccCategoryId,
                externalId: bankTransaction.id,
                exchangeRate,
                toIban: bankTransaction.counterIban ?? null
            }
        ]
    };
};
