import { getUnixTime } from 'date-fns';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { BankTransactionTypeEnum } from '../../core/enum/bank-transaction-type.enum';
import { generateStableExternalIdHash } from '../../core/util/generate-stable-external-id-hash.util';
import { PRIVATBANK_EXTERNAL_ID_LENGTH } from '../constant/privatbank.constant';

import { privatbankCurrencyCodeMapper } from './privatbank-currency-code.mapper';

import type { BankTransactionInterface } from '../../core/interface/bank-transaction.interface';
import type { PrivatbankExternalIdInputInterface } from '../interface/privatbank-external-id-input.interface';
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

const generatePrivatbankExternalId = (input: PrivatbankExternalIdInputInterface): string =>
    generateStableExternalIdHash(
        [
            input.rawDate,
            input.card,
            input.description,
            input.cardAmount,
            input.cardCurrency,
            input.operationAmount,
            input.operationCurrency
        ].join('|')
    ).slice(0, PRIVATBANK_EXTERNAL_ID_LENGTH);

const generatePrivatbankLegacyExternalId = (input: PrivatbankExternalIdInputInterface): string =>
    generateStableExternalIdHash(
        [
            input.rawDate,
            input.card,
            input.category,
            input.description,
            input.cardAmount,
            input.cardCurrency,
            input.operationAmount,
            input.operationCurrency,
            input.endBalance,
            input.balanceCurrency
        ].join('|')
    ).slice(0, PRIVATBANK_EXTERNAL_ID_LENGTH);

const generatePrivatbankParsedDateLegacyExternalId = (input: PrivatbankExternalIdInputInterface): string =>
    generateStableExternalIdHash(
        `${input.date.toISOString()}|${input.card}|${input.cardAmount}|${input.operationAmount}|${input.description}`
    ).slice(0, PRIVATBANK_EXTERNAL_ID_LENGTH);

export const privatbankTransactionMapper = (row: PrivatbankRowInterface): BankTransactionInterface => {
    const id = generatePrivatbankExternalId(row);
    const legacyExternalId = generatePrivatbankLegacyExternalId(row);
    const parsedDateLegacyExternalId = generatePrivatbankParsedDateLegacyExternalId(row);
    const legacyExternalIds = [...new Set([legacyExternalId, parsedDateLegacyExternalId].filter(item => item !== id))];

    return {
        id,
        ...(isNotEmptyArray(legacyExternalIds) && { legacyExternalIds }),
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
        category: row.category,
        feeAmount: getFeeAmount(row)
    };
};
