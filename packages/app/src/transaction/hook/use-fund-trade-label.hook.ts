import { TransactionTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { isSecurityInstrumentType } from '../../instrument/utils/is-security-instrument-type.util';

import { useDividendRoleLabel } from './use-dividend-role-label.hook';
import { useProtectedInstrumentAmountLabel } from './use-protected-instrument-amount-label.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useFundTradeLabel = (transaction: TransactionWithRelationsEntityInterface, accountId: number | null) => {
    const { t } = useLingui();
    const formatQuantity = useProtectedInstrumentAmountLabel();
    const dividendRole = useDividendRoleLabel(transaction);
    const fundEntry = transaction.entries.find(entry => isSecurityInstrumentType(entry.account.instrument.type));

    if (isDefined(dividendRole) || !isDefined(fundEntry)) {
        return dividendRole;
    }

    const quantity = formatQuantity(
        convertFromMicroUnits(fundEntry.amount),
        fundEntry.account.instrument.symbol,
        fundEntry.account.instrument.type
    );

    if (transaction.type === TransactionTypeEnum.ADJUSTMENT) {
        return t`Adjustment · ${quantity}`;
    }

    const cashTitle = transaction.entries.find(entry => !isSecurityInstrumentType(entry.account.instrument.type))?.account.title;

    if (transaction.type !== TransactionTypeEnum.TRANSFER || !isDefined(cashTitle)) {
        return null;
    }

    const [positionLabel, cashLabel] =
        transaction.toAccountId === fundEntry.accountId
            ? [t`From ${cashTitle}`, t`From ${cashTitle} · +${quantity}`]
            : [t`To ${cashTitle}`, t`To ${cashTitle} · −${quantity}`];

    return accountId === fundEntry.accountId ? positionLabel : cashLabel;
};
