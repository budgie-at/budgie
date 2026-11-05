import { RecurringSeriesKindEnum, TransactionTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';

import { isDefined } from '@rnw-community/shared';

import { getTransactionDisplayTitle } from '../../transaction/utils/get-transaction-display-title.util';
import { getTransactionInfoPrimaryEntry } from '../../transaction/utils/get-transaction-info-primary-entry.util';
import { sumEntryAmounts } from '../../transaction/utils/sum-entry-amounts.util';

import { buildDefaultRecurringFormValues } from './build-default-recurring-form-values.util';

import type { RecurringSeriesFormValues } from '../constant/recurring-series-form-schema.constant';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const buildRecurringFormValuesFromTransaction = (
    transaction: TransactionWithRelationsEntityInterface,
    defaultInstrumentId: number
): RecurringSeriesFormValues => {
    const defaults = buildDefaultRecurringFormValues(defaultInstrumentId, transaction.operatedAt);
    const primaryEntry = getTransactionInfoPrimaryEntry(transaction);

    if (!isDefined(primaryEntry)) {
        return { ...defaults, title: getTransactionDisplayTitle(transaction) };
    }

    const amountInMicroUnits = sumEntryAmounts(
        getTransactionCategoryEntries(transaction.entries).filter(entry => entry.accountId === primaryEntry.accountId)
    );

    return {
        ...defaults,
        kind: transaction.type === TransactionTypeEnum.INCOME ? RecurringSeriesKindEnum.INCOME : RecurringSeriesKindEnum.EXPENSE,
        title: getTransactionDisplayTitle(transaction),
        amount: Math.abs(convertFromMicroUnits(amountInMicroUnits)),
        instrumentId: primaryEntry.account.instrument.id,
        categoryId: primaryEntry.categoryId,
        accountId: primaryEntry.accountId
    };
};
