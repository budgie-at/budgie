import { ExternalSourceEnum, InstrumentTypeEnum, TransactionTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useFormatFundQuantity } from '../../i18n/hook/use-format-fund-quantity.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useFundTradeLabel = (transaction: TransactionWithRelationsEntityInterface) => {
    const { t } = useLingui();
    const formatFundQuantity = useFormatFundQuantity();
    const fundEntry = transaction.entries.find(entry => entry.account.instrument.type === InstrumentTypeEnum.FUND);

    if (
        transaction.type === TransactionTypeEnum.INCOME &&
        transaction.externalSource === ExternalSourceEnum.INZHUR &&
        isDefined(transaction.fundAccountId)
    ) {
        return [t`Reinvested dividends (estimated)`, t`Reinvested dividends`];
    }

    if (!isDefined(fundEntry)) {
        return null;
    }

    const quantity = formatFundQuantity(convertFromMicroUnits(fundEntry.amount));

    if (transaction.type === TransactionTypeEnum.ADJUSTMENT) {
        return [t`From first statement · ${quantity}`, quantity];
    }

    const cashTitle = transaction.entries.find(entry => entry.account.instrument.type !== InstrumentTypeEnum.FUND)?.account.title;

    if (transaction.type !== TransactionTypeEnum.TRANSFER || !isDefined(cashTitle)) {
        return null;
    }

    const signedQuantity = transaction.toAccountId === fundEntry.accountId ? `+${quantity}` : `−${quantity}`;

    return [
        transaction.toAccountId === fundEntry.accountId ? t`From ${cashTitle} · ${signedQuantity}` : t`To ${cashTitle} · ${signedQuantity}`,
        signedQuantity
    ];
};
