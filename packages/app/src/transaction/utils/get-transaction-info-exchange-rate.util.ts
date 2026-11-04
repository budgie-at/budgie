import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { getTransactionInfoDestinationEntry } from './get-transaction-info-destination-entry.util';
import { getTransactionInfoPrimaryEntry } from './get-transaction-info-primary-entry.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const getTransactionInfoExchangeRate = (
    transaction: TransactionWithRelationsEntityInterface,
    formatRate: (value: number, symbol?: string) => string
): string | null => {
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

    return `1 ${sourceInstrument.code} = ${formatRate(destinationEntry.amount / sourceEntry.amount)} ${destinationInstrument.code}`;
};
