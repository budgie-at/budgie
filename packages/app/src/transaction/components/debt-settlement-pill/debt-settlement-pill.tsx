import { AccountDebtTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { TransactionMetaPill } from '../transaction-meta-pill/transaction-meta-pill';

import type { DebtSettlementAccountInterface } from '../../interface/debt-settlement-account.interface';

interface Props {
    readonly account: DebtSettlementAccountInterface | null;
    readonly testID?: string;
}

const DEBT_SETTLEMENT_LABEL: Record<AccountDebtTypeEnum, MessageDescriptor> = {
    [AccountDebtTypeEnum.LENT]: msg`Debt`,
    [AccountDebtTypeEnum.BORROW]: msg`Debt`,
    [AccountDebtTypeEnum.INSTALLMENT]: msg`Installment plan`
};

const DEBT_SETTLEMENT_ICON: Record<AccountDebtTypeEnum, UserIconNameEnum> = {
    [AccountDebtTypeEnum.LENT]: UserIconNameEnum.HandCoins,
    [AccountDebtTypeEnum.BORROW]: UserIconNameEnum.HandCoins,
    [AccountDebtTypeEnum.INSTALLMENT]: UserIconNameEnum.CalendarClock
};

export const DebtSettlementPill = ({ account, testID }: Props) => {
    const { t } = useLingui();

    if (!isDefined(account)) {
        return null;
    }

    const label = `${t(DEBT_SETTLEMENT_LABEL[account.debtType])} · ${account.title}`;
    const hasOwnIcon = account.debtType === AccountDebtTypeEnum.INSTALLMENT && isNotEmptyString(account.icon);
    const icon = hasOwnIcon ? account.icon : DEBT_SETTLEMENT_ICON[account.debtType];

    return <TransactionMetaPill icon={icon} label={label} testID={testID} variant="warning" />;
};
