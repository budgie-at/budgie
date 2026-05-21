import { BankTransactionTypeEnum } from '@budgie/bank-sync';
import { CategorySourceEnum, ExternalSourceEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import type { BankTransactionInterface } from '@budgie/bank-sync';
import type { MccCategoryLookupInterface, TransactionCreateInputInterface } from '@budgie/contracts';

export const mapBankTransactionToCreateInput = (
    bankTransaction: BankTransactionInterface,
    accountId: number,
    mccCategoryLookup: MccCategoryLookupInterface | null,
    provider: ExternalSourceEnum
): TransactionCreateInputInterface => {
    const isIncome = bankTransaction.type === BankTransactionTypeEnum.INCOME;
    const amount = Math.abs(bankTransaction.amount);
    const operationAmount = Math.abs(bankTransaction.operationAmount);
    const entryType = isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT;

    const exchangeRate = isPositiveNumber(operationAmount) && amount !== operationAmount ? amount / operationAmount : 1;
    const hasMccDefault = isPositiveNumber(mccCategoryLookup?.defaultCategoryId);
    const categorySource = hasMccDefault ? CategorySourceEnum.MCC_DEFAULT : CategorySourceEnum.USER;

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
                categoryId: mccCategoryLookup?.defaultCategoryId ?? null,
                categorySource,
                mccCategoryId: mccCategoryLookup?.id ?? null,
                externalId: bankTransaction.id,
                exchangeRate,
                toIban: bankTransaction.counterIban ?? null
            }
        ]
    };
};
