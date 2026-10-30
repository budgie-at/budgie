import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';
import { TransactionInfoActionRow } from '../transaction-info-action-row/transaction-info-action-row';
import { TransactionInfoGroup } from '../transaction-info-group/transaction-info-group';

interface Props {
    readonly transactionId: number;
}

export const TransactionInfoUndoRefundGroup = ({ transactionId }: Props) => {
    const { t } = useLingui();
    const undoRefund = useRevertConsolidation(transactionId, () => void dismissAllOrReplace('/'));

    return (
        <TransactionInfoGroup>
            <TransactionInfoActionRow
                icon={UserIconNameEnum.Undo2}
                label={t`Undo refund`}
                onPress={undoRefund}
                testID={TransactionActionsMenuSelector.RevertButton}
            />
        </TransactionInfoGroup>
    );
};
