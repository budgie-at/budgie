import { BankTransactionInterface, BankTransactionTypeEnum } from '@budgie/bank-sync';
import { ExternalSourceEnum, TransactionCreateInputInterface, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

export const mapBankTransactionToCreateInput = (
    bankTransaction: BankTransactionInterface,
    accountId: number,
    mccCategoryId: number | null,
    provider: ExternalSourceEnum
): TransactionCreateInputInterface => {
    const isIncome = bankTransaction.type === BankTransactionTypeEnum.INCOME;
    const amount = Math.abs(bankTransaction.amount);
    const entryType = isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT;

    return {
        amount,
        title: bankTransaction.description,
        comment: bankTransaction.comment ?? '',
        type: isIncome ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE,
        exchangeRate: 1,
        operatedAt: new Date(bankTransaction.time * 1000),
        externalId: bankTransaction.id,
        externalSource: provider,
        fromAccountId: isIncome ? null : accountId,
        toAccountId: isIncome ? accountId : null,
        tagIds: [],
        entries: [{ accountId, type: entryType, amount, categoryId: null, mccCategoryId, externalId: bankTransaction.id }]
    };
};
