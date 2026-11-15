import {
    BANK_FEE_CATEGORY_ID,
    CategorySourceEnum,
    ExternalSourceEnum,
    INVESTMENTS_CATEGORY_ID,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { SyncTransactionTypeEnum } from '../enum/sync-transaction-type.enum';

import type { SyncTransactionInterface } from '../interface/sync-transaction.interface';
import type { MccCategoryLookupInterface, TransactionCreateInputInterface, TransactionEntryCreateInputInterface } from '@budgie/contracts';

const FEE_ENTRY_EXTERNAL_ID_SUFFIX = ':fee';

const getExchangeRate = (mainAmount: number, operationAmount: number): number =>
    isPositiveNumber(operationAmount) && mainAmount !== operationAmount ? mainAmount / operationAmount : 1;

const getCategorySource = (mccDefaultCategoryId: number | null, yieldCategoryId: number | null): CategorySourceEnum => {
    if (isPositiveNumber(mccDefaultCategoryId)) {
        return CategorySourceEnum.MCC_DEFAULT;
    }

    return isDefined(yieldCategoryId) ? CategorySourceEnum.RULE : CategorySourceEnum.USER;
};

export const mapBankTransactionToCreateInput = (
    bankTransaction: SyncTransactionInterface,
    accountId: number,
    mccCategoryLookup: MccCategoryLookupInterface | null,
    provider: ExternalSourceEnum
): TransactionCreateInputInterface => {
    const isIncome = bankTransaction.type === SyncTransactionTypeEnum.INCOME;
    const amount = Math.abs(bankTransaction.amount);
    const entryType = isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT;

    const { feeAmount } = bankTransaction;
    const hasFee = isPositiveNumber(feeAmount) && (isIncome || feeAmount < amount);
    const mainAmount = hasFee ? amount + (isIncome ? feeAmount : -feeAmount) : amount;
    const exchangeRate = getExchangeRate(mainAmount, Math.abs(bankTransaction.operationAmount));
    const externalIdAliases = bankTransaction.legacyExternalIds ?? [];

    const mccDefaultCategoryId = mccCategoryLookup?.defaultCategoryId ?? null;
    const yieldCategoryId = isDefined(bankTransaction.yieldKind) ? INVESTMENTS_CATEGORY_ID : null;

    const mainEntry: TransactionEntryCreateInputInterface = {
        accountId,
        type: entryType,
        amount: mainAmount,
        categoryId: mccDefaultCategoryId ?? yieldCategoryId,
        categorySource: getCategorySource(mccDefaultCategoryId, yieldCategoryId),
        mccCategoryId: mccCategoryLookup?.id ?? null,
        externalId: bankTransaction.id,
        exchangeRate,
        toIban: bankTransaction.counterIban ?? null
    };

    const feeEntry: TransactionEntryCreateInputInterface = {
        accountId,
        type: TransactionEntryTypeEnum.FEE,
        amount: feeAmount,
        categoryId: BANK_FEE_CATEGORY_ID,
        categorySource: CategorySourceEnum.FEE,
        mccCategoryId: null,
        externalId: `${bankTransaction.id}${FEE_ENTRY_EXTERNAL_ID_SUFFIX}`,
        exchangeRate: 1,
        toIban: null
    };

    return {
        amount: isIncome ? mainAmount : amount,
        title: bankTransaction.description,
        comment: bankTransaction.comment ?? '',
        type: isIncome ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE,
        exchangeRate,
        operatedAt: new Date(bankTransaction.time * 1000),
        externalId: bankTransaction.id,
        ...(isNotEmptyArray(externalIdAliases) && { externalIdAliases: [...externalIdAliases] }),
        updatedBy: null,
        externalSource: provider,
        fromAccountId: isIncome ? null : accountId,
        toAccountId: isIncome ? accountId : null,
        ...(isDefined(bankTransaction.yieldKind) && { yieldKind: bankTransaction.yieldKind }),
        tagIds: [],
        entries: hasFee ? [mainEntry, feeEntry] : [mainEntry]
    };
};
