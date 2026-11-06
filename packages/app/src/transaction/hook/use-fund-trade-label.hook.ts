import { InstrumentTypeEnum, TransactionTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useFormatFundQuantity } from '../../i18n/hook/use-format-fund-quantity.hook';

import { useDividendRoleLabel } from './use-dividend-role-label.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useFundTradeLabel = (transaction: TransactionWithRelationsEntityInterface) => {
    const { t } = useLingui();
    const formatFundQuantity = useFormatFundQuantity();
    const isAmountProtected = useIsAmountProtected();
    const dividendRole = useDividendRoleLabel(transaction);
    const fundEntry = transaction.entries.find(entry => entry.account.instrument.type === InstrumentTypeEnum.FUND);

    if (isDefined(dividendRole) || !isDefined(fundEntry)) {
        return dividendRole;
    }

    const quantity = isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatFundQuantity(convertFromMicroUnits(fundEntry.amount));

    if (transaction.type === TransactionTypeEnum.ADJUSTMENT) {
        return t`Adjustment · ${quantity}`;
    }

    const cashTitle = transaction.entries.find(entry => entry.account.instrument.type !== InstrumentTypeEnum.FUND)?.account.title;

    if (transaction.type !== TransactionTypeEnum.TRANSFER || !isDefined(cashTitle)) {
        return null;
    }

    return transaction.toAccountId === fundEntry.accountId ? t`From ${cashTitle} · +${quantity}` : t`To ${cashTitle} · −${quantity}`;
};
