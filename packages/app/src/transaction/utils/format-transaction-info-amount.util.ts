import { TransactionTypeEnum, convertFromMicroUnits } from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { getSecurityTrade } from './get-security-trade.util';
import { getTransactionInfoPrimaryEntry } from './get-transaction-info-primary-entry.util';
import { getTransactionPrimaryAmount } from './get-transaction-primary-amount.util';
import { getTransactionType } from './get-transaction-type.util';

import type { InstrumentTypeEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const formatTransactionInfoAmount = (
    transaction: TransactionWithRelationsEntityInterface,
    formatAmount: (amount: number, symbol: string, instrumentType: InstrumentTypeEnum | null) => string
): string => {
    const trade = getSecurityTrade(transaction);

    if (isDefined(trade)) {
        const sign = isPositiveNumber(trade.cashFlow) ? '+' : '';

        return `${sign}${formatAmount(convertFromMicroUnits(Math.abs(trade.cashFlow)), trade.cashInstrument.symbol, trade.cashInstrument.type)}`;
    }

    const primaryEntry = getTransactionInfoPrimaryEntry(transaction);

    if (!isDefined(primaryEntry)) {
        return '';
    }

    const { symbol, type } = primaryEntry.account.instrument;
    const sign = getTransactionType(transaction) === TransactionTypeEnum.INCOME ? '+' : '';

    return `${sign}${formatAmount(convertFromMicroUnits(getTransactionPrimaryAmount(transaction)), symbol, type)}`;
};
