import { getUnixTime } from 'date-fns';

import { isPositiveNumber } from '@rnw-community/shared';

import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { BankTransactionTypeEnum } from '../../core/enum/bank-transaction-type.enum';
import { generatePrivatbankExternalId } from '../util/generate-privatbank-external-id.util';

import { privatbankCurrencyCodeMapper } from './privatbank-currency-code.mapper';

import type { BankTransactionInterface } from '../../core/interface/bank-transaction.interface';
import type { PrivatbankRowInterface } from '../interface/privatbank-row.interface';

const getTransactionType = (amount: number): BankTransactionTypeEnum =>
    isPositiveNumber(amount) ? BankTransactionTypeEnum.INCOME : BankTransactionTypeEnum.EXPENSE;

export const privatbankTransactionMapper = (row: PrivatbankRowInterface): BankTransactionInterface => ({
    id: generatePrivatbankExternalId(row),
    provider: BankProviderEnum.PRIVATBANK,
    accountId: row.card,
    type: getTransactionType(row.cardAmount),
    time: getUnixTime(row.date),
    description: row.description,
    mcc: 0,
    originalMcc: 0,
    amount: Math.abs(row.cardAmount),
    operationAmount: Math.abs(row.operationAmount),
    currencyCode: privatbankCurrencyCodeMapper(row.operationCurrency),
    commissionRate: 0,
    cashbackAmount: 0,
    balance: row.endBalance,
    hold: false,
    category: row.category
});
