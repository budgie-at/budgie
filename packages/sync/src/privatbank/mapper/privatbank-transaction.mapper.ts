import { getUnixTime } from 'date-fns/getUnixTime';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { SyncProviderEnum } from '../../core/enum/sync-provider.enum';
import { SyncTransactionTypeEnum } from '../../core/enum/sync-transaction-type.enum';
import {
    generatePrivatbankExternalId,
    generatePrivatbankLegacyExternalId,
    generatePrivatbankParsedDateLegacyExternalId
} from '../util/generate-privatbank-external-id.util';

import { privatbankCurrencyCodeMapper } from './privatbank-currency-code.mapper';

import type { SyncTransactionInterface } from '../../core/interface/sync-transaction.interface';
import type { PrivatbankRowInterface } from '../interface/privatbank-row.interface';

const getTransactionType = (amount: number): SyncTransactionTypeEnum =>
    isPositiveNumber(amount) ? SyncTransactionTypeEnum.INCOME : SyncTransactionTypeEnum.EXPENSE;

const getFeeAmount = (row: PrivatbankRowInterface): number => {
    if (row.cardCurrency !== row.operationCurrency) {
        return 0;
    }

    const fee = Math.abs(row.cardAmount) - Math.abs(row.operationAmount);

    return isPositiveNumber(fee) ? fee : 0;
};

export const privatbankTransactionMapper = (row: PrivatbankRowInterface): SyncTransactionInterface => {
    const id = generatePrivatbankExternalId(row);
    const legacyExternalId = generatePrivatbankLegacyExternalId(row);
    const parsedDateLegacyExternalId = generatePrivatbankParsedDateLegacyExternalId(row);
    const legacyExternalIds = [...new Set([legacyExternalId, parsedDateLegacyExternalId].filter(item => item !== id))];

    return {
        id,
        ...(isNotEmptyArray(legacyExternalIds) && { legacyExternalIds }),
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
