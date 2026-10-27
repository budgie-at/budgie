import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';
import { DEBT_SETTLEMENT_LABEL } from '../../constant/debt-settlement-label.constant';
import { getDebtSettlementIcon } from '../../utils/get-debt-settlement-icon.util';

import type { DebtSettlementAccountInterface } from '../../interface/debt-settlement-account.interface';

interface Props {
    readonly account: DebtSettlementAccountInterface | null;
    readonly testID?: string;
}

export const DebtSettlementPill = ({ account, testID }: Props) => {
    const { t } = useLingui();

    if (!isDefined(account)) {
        return null;
    }

    const label = `${t(DEBT_SETTLEMENT_LABEL[account.debtType])} · ${account.title}`;

    return <MetaPill icon={getDebtSettlementIcon(account)} label={label} testID={testID} variant="warning" />;
};
