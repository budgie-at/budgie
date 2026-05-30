import { BankTransactionTypeEnum } from '@budgie/bank-sync';
import {
    BANK_FEE_CATEGORY_ID,
    CategorySourceEnum,
    ExternalSourceEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import type { BankTransactionInterface } from '@budgie/bank-sync';
import type { MccCategoryLookupInterface, TransactionCreateInputInterface, TransactionEntryCreateInputInterface } from '@budgie/contracts';

const FEE_ENTRY_EXTERNAL_ID_SUFFIX = ':fee';

const getExchangeRate = (mainAmount: number, operationAmount: number): number =>
    isPositiveNumber(operationAmount) && mainAmount !== operationAmount ? mainAmount / operationAmount : 1;

export const mapBankTransactionToCreateInput = (
    bankTransaction: BankTransactionInterface,
    accountId: number,
    mccCategoryLookup: MccCategoryLookupInterface | null,
    provider: ExternalSourceEnum
): TransactionCreateInputInterface => {
    const isIncome = bankTransaction.type === BankTransactionTypeEnum.INCOME;
    const amount = Math.abs(bankTransaction.amount);
    const entryType = isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT;

    const { feeAmount } = bankTransaction;
    const hasFee = isPositiveNumber(feeAmount) && feeAmount < amount;
    const mainAmount = hasFee ? amount - feeAmount : amount;
    const exchangeRate = getExchangeRate(mainAmount, Math.abs(bankTransaction.operationAmount));

    const mainEntry: TransactionEntryCreateInputInterface = {
        accountId,
        type: entryType,
        amount: mainAmount,
        categoryId: mccCategoryLookup?.defaultCategoryId ?? null,
        categorySource: isPositiveNumber(mccCategoryLookup?.defaultCategoryId) ? CategorySourceEnum.MCC_DEFAULT : CategorySourceEnum.USER,
        mccCategoryId: mccCategoryLookup?.id ?? null,
        externalId: bankTransaction.id,
        exchangeRate,
        toIban: bankTransaction.counterIban ?? null
    };

    const feeEntry: TransactionEntryCreateInputInterface = {
        accountId,
        type: entryType,
        amount: feeAmount,
        categoryId: BANK_FEE_CATEGORY_ID,
        categorySource: CategorySourceEnum.FEE,
        mccCategoryId: null,
        externalId: `${bankTransaction.id}${FEE_ENTRY_EXTERNAL_ID_SUFFIX}`,
        exchangeRate: 1,
        toIban: null
    };

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
        entries: hasFee ? [mainEntry, feeEntry] : [mainEntry]
    };
};
