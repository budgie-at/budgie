import { InstrumentTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useFundTradeLabel = (transaction: TransactionWithRelationsEntityInterface) => {
    const { t } = useLingui();
    const fundEntry = transaction.entries.find(entry => entry.account.instrument.type === InstrumentTypeEnum.FUND);
    const cashEntry = transaction.entries.find(entry => entry.account.instrument.type !== InstrumentTypeEnum.FUND);

    if (transaction.type === TransactionTypeEnum.ADJUSTMENT && isDefined(fundEntry)) {
        return t`From first statement`;
    }

    if (transaction.type !== TransactionTypeEnum.TRANSFER || !isDefined(fundEntry) || !isDefined(cashEntry)) {
        return null;
    }

    const cashTitle = cashEntry.account.title;

    return transaction.toAccountId === fundEntry.accountId ? t`From ${cashTitle}` : t`To ${cashTitle}`;
};
