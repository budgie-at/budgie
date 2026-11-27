import { RecurringSeriesKindEnum, TransactionTypeEnum, convertFromMicroUnits } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { getEnableBankingTransactionDisplayTitle } from '../../transaction/utils/get-enable-banking-transaction-display-title.util';
import { getTransactionInfoPrimaryEntry } from '../../transaction/utils/get-transaction-info-primary-entry.util';
import { getTransactionPrimaryAmount } from '../../transaction/utils/get-transaction-primary-amount.util';

import { buildDefaultRecurringFormValues } from './build-default-recurring-form-values.util';

import type { RecurringSeriesFormValues } from '../constant/recurring-series-form-schema.constant';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const buildRecurringFormValuesFromTransaction = (
    transaction: TransactionWithRelationsEntityInterface,
    defaultInstrumentId: number
): RecurringSeriesFormValues => {
    const defaults = buildDefaultRecurringFormValues(defaultInstrumentId, transaction.operatedAt);
    const primaryEntry = getTransactionInfoPrimaryEntry(transaction);
    const title = getEnableBankingTransactionDisplayTitle(transaction);

    if (!isDefined(primaryEntry)) {
        return { ...defaults, title };
    }

    const amountInMicroUnits = getTransactionPrimaryAmount(transaction);

    return {
        ...defaults,
        kind: transaction.type === TransactionTypeEnum.INCOME ? RecurringSeriesKindEnum.INCOME : RecurringSeriesKindEnum.EXPENSE,
        title,
        amount: Math.abs(convertFromMicroUnits(amountInMicroUnits)),
        instrumentId: primaryEntry.account.instrument.id,
        categoryId: primaryEntry.categoryId,
        accountId: primaryEntry.accountId
    };
};
