import { TransactionTypeEnum, convertFromMicroUnits } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { getTransactionInfoPrimaryEntry } from './get-transaction-info-primary-entry.util';
import { getTransactionPrimaryAmount } from './get-transaction-primary-amount.util';
import { getTransactionType } from './get-transaction-type.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const formatTransactionInfoAmount = (
    transaction: TransactionWithRelationsEntityInterface,
    formatDigits: (value: number, symbol?: string) => string
): string => {
    const primaryEntry = getTransactionInfoPrimaryEntry(transaction);

    if (!isDefined(primaryEntry)) {
        return '';
    }

    const amountInMicroUnits = getTransactionPrimaryAmount(transaction);
    const sign = getTransactionType(transaction) === TransactionTypeEnum.INCOME ? '+' : '';

    return `${sign}${formatDigits(convertFromMicroUnits(amountInMicroUnits), primaryEntry.account.instrument.symbol)}`;
};
