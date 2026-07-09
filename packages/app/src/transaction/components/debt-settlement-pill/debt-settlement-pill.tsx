import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';

import { isDefined } from '@rnw-community/shared';

import { TransactionMetaPill } from '../transaction-meta-pill/transaction-meta-pill';

interface Props {
    readonly accountTitle: string | null;
    readonly testID?: string;
}

const getDebtSettlementLabel = (accountTitle: string | null) => {
    if (!isDefined(accountTitle)) {
        return null;
    }

    return t`Debt · ${accountTitle}`;
};

export const DebtSettlementPill = ({ accountTitle, testID }: Props) => {
    const debtSettlementLabel = getDebtSettlementLabel(accountTitle);

    if (!isDefined(debtSettlementLabel)) {
        return null;
    }

    return <TransactionMetaPill icon={UserIconNameEnum.HandCoins} label={debtSettlementLabel} testID={testID} variant="warning" />;
};
