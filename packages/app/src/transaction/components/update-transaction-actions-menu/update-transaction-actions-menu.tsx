import { TransactionActionsMenu } from '../transaction-actions-menu/transaction-actions-menu';
import { TransactionConvertMenuItem } from '../transaction-convert-menu-item/transaction-convert-menu-item';

import type { TransactionActionsMenuItemInterface } from '../../interface/transaction-actions-menu-item.interface';
import type { TransactionActionsMenuPropsInterface } from '../../interface/transaction-actions-menu-props.interface';

interface Props extends Pick<TransactionActionsMenuPropsInterface, 'onDelete' | 'isConsolidated' | 'onRevert'> {
    readonly items: readonly TransactionActionsMenuItemInterface[];
}

export const UpdateTransactionActionsMenu = ({ onDelete, isConsolidated, onRevert, items }: Props) => (
    <TransactionActionsMenu onDelete={onDelete} isConsolidated={isConsolidated} {...(isConsolidated && { onRevert })}>
        {items.map(item => (
            <TransactionConvertMenuItem key={item.key} icon={item.icon} label={item.label} onConvert={item.onPress} testID={item.testID} />
        ))}
    </TransactionActionsMenu>
);
