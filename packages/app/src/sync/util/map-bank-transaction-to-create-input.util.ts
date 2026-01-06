import { BankTransactionInterface, BankTransactionTypeEnum } from '@budgie/bank-sync';
import { ExternalSourceEnum, TransactionCreateInputInterface, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

const EXCHANGE_RATE_PRECISION = 1000000;

export const mapBankTransactionToCreateInput = (
    bankTx: BankTransactionInterface,
    accountId: number,
    mccCategoryId: number | null,
    provider: ExternalSourceEnum
): TransactionCreateInputInterface => {
    const isIncome = bankTx.type === BankTransactionTypeEnum.INCOME;
    const amount = Math.abs(bankTx.amount);
    const operationAmount = Math.abs(bankTx.operationAmount);
    const entryType = isIncome ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT;

    const exchangeRate =
        operationAmount !== 0 && amount !== operationAmount ? Math.floor((amount / operationAmount) * EXCHANGE_RATE_PRECISION) : 1;

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
        entries: [
            {
                accountId,
                type: entryType,
                amount,
                categoryId: null,
                mccCategoryId,
                externalId: bankTx.id,
                exchangeRate,
                toIban: bankTx.counterIban ?? null
            }
        ]
    };
};
