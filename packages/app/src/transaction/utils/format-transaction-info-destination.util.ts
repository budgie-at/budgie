import { convertFromMicroUnits } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { getSecurityTrade } from './get-security-trade.util';
import { getTransactionInfoDestinationEntry } from './get-transaction-info-destination-entry.util';
import { getTransactionInfoPrimaryEntry } from './get-transaction-info-primary-entry.util';

import type { InstrumentTypeEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const formatTransactionInfoDestination = (
    transaction: TransactionWithRelationsEntityInterface,
    formatAmount: (amount: number, symbol: string, instrumentType: InstrumentTypeEnum | null) => string
): string | null => {
    const trade = getSecurityTrade(transaction);

    if (isDefined(trade)) {
        const { symbol, type } = trade.securityEntry.account.instrument;
        const quantity = formatAmount(convertFromMicroUnits(trade.quantity), symbol, type);

        return trade.isBuy ? `→ +${quantity}` : `−${quantity}`;
    }

    const sourceEntry = getTransactionInfoPrimaryEntry(transaction);
    const destinationEntry = getTransactionInfoDestinationEntry(transaction);

    if (
        !isDefined(sourceEntry) ||
        !isDefined(destinationEntry) ||
        sourceEntry.account.instrument.id === destinationEntry.account.instrument.id
    ) {
        return null;
    }

    const { symbol, type } = destinationEntry.account.instrument;

    return `→ ${formatAmount(convertFromMicroUnits(destinationEntry.amount), symbol, type)}`;
};
