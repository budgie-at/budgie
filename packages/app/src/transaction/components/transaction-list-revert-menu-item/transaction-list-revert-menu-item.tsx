import { TransactionConsolidationTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { TransactionListContextMenuSelector } from '../transaction-list-context-menu/transaction-list-context-menu.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionListRevertMenuItem = ({ transaction }: Props) => {
    const { t } = useLingui();
    const isRefund = transaction.consolidationType === TransactionConsolidationTypeEnum.REFUND;
    const revertConsolidation = useRevertConsolidation(transaction.id, void 0, isRefund);

    const isConsolidated = isDefined(transaction.consolidationType);
    const label = isRefund ? t`Undo Refund` : t`Separate Transactions`;

    if (!isConsolidated) {
        return null;
    }

    return (
        <ActionsMenuItem
            icon={UserIconNameEnum.Undo2}
            label={label}
            onPress={revertConsolidation}
            variant="destructive"
            testID={TransactionListContextMenuSelector.RevertButton}
        />
    );
};
