import { getUnixTime } from 'date-fns';

import { isPositiveNumber } from '@rnw-community/shared';

import { BankTransactionTypeEnum } from '../../core/enum/bank-transaction-type.enum';
import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { generatePrivatbankExternalId, generatePrivatbankLegacyExternalId } from '../util/generate-privatbank-external-id.util';

import { privatbankCurrencyCodeMapper } from './privatbank-currency-code.mapper';

import type { BankTransactionInterface } from '../../core/interface/bank-transaction.interface';
import type { PrivatbankRowInterface } from '../interface/privatbank-row.interface';

const getTransactionType = (amount: number): BankTransactionTypeEnum =>
    isPositiveNumber(amount) ? BankTransactionTypeEnum.INCOME : BankTransactionTypeEnum.EXPENSE;

const getFeeAmount = (row: PrivatbankRowInterface): number => {
    if (row.cardCurrency !== row.operationCurrency) {
        return 0;
    }

    const fee = Math.abs(row.cardAmount) - Math.abs(row.operationAmount);

    return isPositiveNumber(fee) ? fee : 0;
};

export const privatbankTransactionMapper = (row: PrivatbankRowInterface): BankTransactionInterface => {
    const id = generatePrivatbankExternalId(row);
    const legacyExternalId = generatePrivatbankLegacyExternalId(row);

    return {
        id,
        ...(id !== legacyExternalId && { legacyExternalIds: [legacyExternalId] }),
        provider: SyncProviderEnum.PRIVATBANK,
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
        category: row.category,
        feeAmount: getFeeAmount(row)
    };
};
