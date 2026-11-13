import { TransactionTypeEnum } from '@budgie/contracts';
import { getTransactionCategoryEntries, getTransactionFeeEntries } from '@budgie/ledger';

import { isDefined } from '@rnw-community/shared';

import { isSecurityInstrumentType } from '../../instrument/utils/is-security-instrument-type.util';

import { sumEntryAmounts } from './sum-entry-amounts.util';

import type { TransactionAssociationEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const getSecurityTrade = (
    transaction: Pick<TransactionWithRelationsEntityInterface, TransactionAssociationEnum.ENTRIES | 'toAccountId' | 'type'>
) => {
    const entries = getTransactionCategoryEntries(transaction.entries);
    const securityEntries = entries.filter(entry => isSecurityInstrumentType(entry.account.instrument.type));
    const cashEntries = entries.filter(entry => !isSecurityInstrumentType(entry.account.instrument.type));
    const securityEntry = securityEntries.at(0);
    const cashEntry = cashEntries.at(0);

    if (transaction.type !== TransactionTypeEnum.TRANSFER || !isDefined(securityEntry) || !isDefined(cashEntry)) {
        return null;
    }

    const isBuy = securityEntry.accountId === transaction.toAccountId;
    const cash = sumEntryAmounts(cashEntries);
    const fee = sumEntryAmounts(getTransactionFeeEntries(transaction.entries));

    return {
        isBuy,
        securityEntry,
        cashInstrument: cashEntry.account.instrument,
        quantity: sumEntryAmounts(securityEntries),
        fee,
        cashFlow: isBuy ? -(cash + fee) : cash - fee
    };
};
