import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { BankTransactionTypeEnum } from '../../core/enum/bank-transaction-type.enum';

import type { BankTransactionInterface } from '../../core/interface/bank-transaction.interface';
import type { MonobankTransactionApiInterface } from '../interface/monobank-transaction-api.interface';

const getTransactionType = (amount: number): BankTransactionTypeEnum =>
    amount >= 0 ? BankTransactionTypeEnum.INCOME : BankTransactionTypeEnum.EXPENSE;

export const monobankTransactionMapper = (transaction: MonobankTransactionApiInterface, accountId: string): BankTransactionInterface => ({
    id: transaction.id,
    provider: BankProviderEnum.MONOBANK,
    accountId,
    time: transaction.time,
    description: transaction.description,
    mcc: transaction.mcc,
    originalMcc: transaction.originalMcc,
    amount: transaction.amount,
    operationAmount: transaction.operationAmount,
    currencyCode: transaction.currencyCode,
    commissionRate: transaction.commissionRate,
    cashbackAmount: transaction.cashbackAmount,
    balance: transaction.balance,
    hold: transaction.hold,
    type: getTransactionType(transaction.amount),
    receiptId: transaction.receiptId,
    invoiceId: transaction.invoiceId,
    counterEdrpou: transaction.counterEdrpou,
    counterIban: transaction.counterIban,
    counterName: transaction.counterName,
    comment: transaction.comment
});
