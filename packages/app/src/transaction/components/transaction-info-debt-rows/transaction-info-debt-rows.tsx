import { DebtEventAssociationEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { DEBT_SETTLEMENT_LABEL } from '../../constant/debt-settlement-label.constant';
import { getDebtSettlementIcon } from '../../utils/get-debt-settlement-icon.util';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionInfoDebtRows = ({ transaction }: Props) => {
    const { t } = useLingui();
    const debtAccount = transaction.debtEvents.at(0)?.[DebtEventAssociationEnum.DEBT_ACCOUNT];

    if (!isDefined(debtAccount)) {
        return null;
    }

    return (
        <TransactionInfoRow
            icon={getDebtSettlementIcon(debtAccount)}
            label={t(DEBT_SETTLEMENT_LABEL[debtAccount.debtType])}
            value={debtAccount.title}
            testID={TransactionInfoPageSelector.Row.Debt}
        />
    );
};
