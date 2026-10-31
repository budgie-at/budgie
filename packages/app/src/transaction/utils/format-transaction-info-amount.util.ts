import { TransactionTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';

import { isDefined } from '@rnw-community/shared';

import { getTransactionInfoPrimaryEntry } from './get-transaction-info-primary-entry.util';
import { getTransactionType } from './get-transaction-type.util';
import { sumEntryAmounts } from './sum-entry-amounts.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const formatTransactionInfoAmount = (
    transaction: TransactionWithRelationsEntityInterface,
    formatDigits: (value: number, symbol?: string) => string
): string => {
    const primaryEntry = getTransactionInfoPrimaryEntry(transaction);

    if (!isDefined(primaryEntry)) {
        return '';
    }

    const amountInMicroUnits = sumEntryAmounts(
        getTransactionCategoryEntries(transaction.entries).filter(entry => entry.accountId === primaryEntry.accountId)
    );
    const sign = getTransactionType(transaction) === TransactionTypeEnum.INCOME ? '+' : '';

    return `${sign}${formatDigits(convertFromMicroUnits(amountInMicroUnits), primaryEntry.account.instrument.symbol)}`;
};
