import { CreateRuleMenuItem } from '../create-rule-menu-item/create-rule-menu-item';
import { TransactionActionsMenu } from '../transaction-actions-menu/transaction-actions-menu';
import { TransactionConvertMenuItem } from '../transaction-convert-menu-item/transaction-convert-menu-item';

import type { TransactionActionsMenuItemInterface } from '../../interface/transaction-actions-menu-item.interface';
import type { TransactionActionsMenuPropsInterface } from '../../interface/transaction-actions-menu-props.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props extends Pick<TransactionActionsMenuPropsInterface, 'onDelete' | 'isConsolidated' | 'onRevert'> {
    readonly items: readonly TransactionActionsMenuItemInterface[];
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const UpdateTransactionActionsMenu = ({ onDelete, isConsolidated, onRevert, items, transaction }: Props) => (
    <TransactionActionsMenu onDelete={onDelete} isConsolidated={isConsolidated} {...(isConsolidated && { onRevert })}>
        <CreateRuleMenuItem transaction={transaction} />
        {items.map(item => (
            <TransactionConvertMenuItem key={item.key} icon={item.icon} label={item.label} onConvert={item.onPress} testID={item.testID} />
        ))}
    </TransactionActionsMenu>
);
