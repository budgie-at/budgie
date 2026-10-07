import { isPositiveNumber } from '@rnw-community/shared';

import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncTransactionTypeEnum } from '../../core/enum/sync-transaction-type.enum';
import { MONOBANK_BALANCE_DIVISOR } from '../constant/monobank-balance-divisor.constant';
import { MONOBANK_ZERO_DECIMAL_CURRENCY_CODES } from '../constant/monobank-zero-decimal-currency-codes.constant';

import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { StatementItem } from '@liaugust/monobank-sdk';

const getTransactionType = (amount: number): SyncTransactionTypeEnum =>
    isPositiveNumber(amount) ? SyncTransactionTypeEnum.INCOME : SyncTransactionTypeEnum.EXPENSE;

export const monobankTransactionMapper = (transaction: StatementItem, accountId: string): SyncTransactionInterface => ({
    accountId,
    id: transaction.id,
    provider: SyncProviderEnum.MONOBANK,
    time: transaction.time,
    description: transaction.description,
    mcc: transaction.mcc,
    originalMcc: transaction.originalMcc,
    amount: transaction.amount / MONOBANK_BALANCE_DIVISOR,
    operationAmount: MONOBANK_ZERO_DECIMAL_CURRENCY_CODES.has(transaction.currencyCode)
        ? transaction.operationAmount
        : transaction.operationAmount / MONOBANK_BALANCE_DIVISOR,
    currencyCode: transaction.currencyCode,
    operationCurrencyCode: transaction.currencyCode,
    commissionRate: transaction.commissionRate / MONOBANK_BALANCE_DIVISOR,
    cashbackAmount: transaction.cashbackAmount / MONOBANK_BALANCE_DIVISOR,
    balance: transaction.balance / MONOBANK_BALANCE_DIVISOR,
    hold: transaction.hold,
    type: getTransactionType(transaction.amount),
    feeAmount: Math.abs(transaction.commissionRate) / MONOBANK_BALANCE_DIVISOR,
    receiptId: transaction.receiptId,
    invoiceId: transaction.invoiceId,
    counterEdrpou: transaction.counterEdrpou,
    counterIban: transaction.counterIban,
    counterName: transaction.counterName,
    comment: transaction.comment
});
