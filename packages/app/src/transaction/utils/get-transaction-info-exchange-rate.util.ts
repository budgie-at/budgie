import { convertFromMicroUnits } from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { getTransactionInfoDestinationEntry } from './get-transaction-info-destination-entry.util';
import { getTransactionInfoPrimaryEntry } from './get-transaction-info-primary-entry.util';

import type { TransactionInfoExchangeRateInterface } from '../interface/transaction-info-exchange-rate.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const getTransactionInfoExchangeRate = (
    transaction: TransactionWithRelationsEntityInterface,
    formatRate: (value: number, symbol?: string) => string,
    formatDigits: (value: number, symbol?: string) => string
): TransactionInfoExchangeRateInterface | null => {
    const sourceEntry = getTransactionInfoPrimaryEntry(transaction);
    const destinationEntry = getTransactionInfoDestinationEntry(transaction);

    if (!isDefined(sourceEntry) || !isDefined(destinationEntry) || !isPositiveNumber(sourceEntry.amount)) {
        return null;
    }

    const sourceInstrument = sourceEntry.account.instrument;
    const destinationInstrument = destinationEntry.account.instrument;

    if (sourceInstrument.id === destinationInstrument.id) {
        return null;
    }

    const sourceAmount = formatDigits(convertFromMicroUnits(sourceEntry.amount), sourceInstrument.symbol);
    const destinationAmount = formatDigits(convertFromMicroUnits(destinationEntry.amount), destinationInstrument.symbol);

    return {
        label: `1 ${sourceInstrument.code} = ${formatRate(destinationEntry.amount / sourceEntry.amount)} ${destinationInstrument.code}`,
        description: `${sourceAmount} → ${destinationAmount}`
    };
};
