import { BankTransactionInterface, BankTransactionTypeEnum } from '@budgie/bank-sync';
import { ExternalSourceEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

export const mapBankTransactionToCreateInput = (bankTx: BankTransactionInterface, accountId: number, provider: ExternalSourceEnum) => {
    const isIncome = bankTx.type === BankTransactionTypeEnum.INCOME;
    const amount = Math.abs(bankTx.amount);
    const entryType = isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT;

    return {
        amount,
        title: bankTx.description,
        comment: bankTx.comment ?? '',
        type: isIncome ? TransactionTypeEnum.INCOME : TransactionTypeEnum.EXPENSE,
        exchangeRate: 1,
        operatedAt: new Date(bankTx.time * 1000),
        externalId: bankTx.id,
        externalSource: provider,
        fromAccountId: isIncome ? null : accountId,
        toAccountId: isIncome ? accountId : null,
        tagIds: [],
        entries: [{ accountId, type: entryType, amount, categoryId: null, externalId: bankTx.id }]
    };
};
