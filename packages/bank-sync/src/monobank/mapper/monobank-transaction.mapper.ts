import { isPositiveNumber } from '@rnw-community/shared';

import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { BankTransactionTypeEnum } from '../../core/enum/bank-transaction-type.enum';
import { MONOBANK_BALANCE_DIVISOR } from '../constant/monobank-balance-divisor.constant';

import type { BankTransactionInterface } from '../../core/interface/bank-transaction.interface';
import type { MonobankTransactionApiInterface } from '../interface/monobank-transaction-api.type';

const getTransactionType = (amount: number): BankTransactionTypeEnum =>
    isPositiveNumber(amount) ? BankTransactionTypeEnum.INCOME : BankTransactionTypeEnum.EXPENSE;

export const monobankTransactionMapper = (transaction: MonobankTransactionApiInterface, accountId: string): BankTransactionInterface => ({
    accountId,
    id: transaction.id,
    provider: BankProviderEnum.MONOBANK,
    time: transaction.time,
    description: transaction.description,
    mcc: transaction.mcc,
    originalMcc: transaction.originalMcc,
    amount: transaction.amount / MONOBANK_BALANCE_DIVISOR,
    operationAmount: transaction.operationAmount / MONOBANK_BALANCE_DIVISOR,
    currencyCode: transaction.currencyCode,
    commissionRate: transaction.commissionRate / MONOBANK_BALANCE_DIVISOR,
    cashbackAmount: transaction.cashbackAmount / MONOBANK_BALANCE_DIVISOR,
    balance: transaction.balance / MONOBANK_BALANCE_DIVISOR,
    hold: transaction.hold,
    type: getTransactionType(transaction.amount),
    receiptId: transaction.receiptId,
    invoiceId: transaction.invoiceId,
    counterEdrpou: transaction.counterEdrpou,
    counterIban: transaction.counterIban,
    counterName: transaction.counterName,
    comment: transaction.comment
});
