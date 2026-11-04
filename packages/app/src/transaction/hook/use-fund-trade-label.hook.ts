import { InstrumentTypeEnum, TransactionTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useFormatFundQuantity } from '../../i18n/hook/use-format-fund-quantity.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useFundTradeLabel = (transaction: TransactionWithRelationsEntityInterface) => {
    const { t } = useLingui();
    const formatFundQuantity = useFormatFundQuantity();
    const fundEntry = transaction.entries.find(entry => entry.account.instrument.type === InstrumentTypeEnum.FUND);
    const cashEntry = transaction.entries.find(entry => entry.account.instrument.type !== InstrumentTypeEnum.FUND);

    if (transaction.type === TransactionTypeEnum.ADJUSTMENT && isDefined(fundEntry)) {
        return t`From first statement`;
    }

    if (transaction.type !== TransactionTypeEnum.TRANSFER || !isDefined(fundEntry) || !isDefined(cashEntry)) {
        return null;
    }

    const cashTitle = cashEntry.account.title;
    const quantityLabel = formatFundQuantity(convertFromMicroUnits(fundEntry.amount));

    return transaction.toAccountId === fundEntry.accountId
        ? t`Bought with ${cashTitle} · +${quantityLabel}`
        : t`Sold for ${cashTitle} · −${quantityLabel}`;
};
