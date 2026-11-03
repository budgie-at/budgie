import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { ActionsMenu } from '../../../@generic/component/actions-menu/actions-menu';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { CreateRuleMenuItem } from '../create-rule-menu-item/create-rule-menu-item';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';

import type { TransactionActionsMenuItemInterface } from '../../interface/transaction-actions-menu-item.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly items: readonly TransactionActionsMenuItemInterface[];
    readonly onDelete: () => unknown;
    readonly onRevert?: EmptyFn;
}

export const UpdateTransactionActionsMenu = ({ transaction, items, onDelete, onRevert }: Props) => {
    const { t } = useLingui();

    return (
        <ActionsMenu
            trigger={<CircleIcon icon={UserIconNameEnum.Ellipsis} variant="ghost" size={44} iconSize={24} border={false} />}
            accessibilityLabel={t`More actions`}
            triggerClassName="min-h-[44px] min-w-[44px] items-center justify-center active:scale-100 active:opacity-70"
            triggerTestID={TransactionActionsMenuSelector.TriggerButton}
            hitSlop={16}
            triggerSize={44}
        >
            <CreateRuleMenuItem transaction={transaction} />
            {items.map(item => (
                <ActionsMenuItem key={item.key} icon={item.icon} label={item.label} onPress={item.onPress} testID={item.testID} />
            ))}
            {isDefined(onRevert) ? (
                <ActionsMenuItem
                    icon={UserIconNameEnum.Undo2}
                    label={t`Separate Transactions`}
                    onPress={onRevert}
                    variant="destructive"
                    testID={TransactionActionsMenuSelector.RevertButton}
                />
            ) : (
                <ActionsMenuItem
                    icon={UserIconNameEnum.Trash2}
                    label={t`Delete Transaction`}
                    onPress={onDelete}
                    variant="destructive"
                    testID={TransactionActionsMenuSelector.DeleteButton}
                />
            )}
        </ActionsMenu>
    );
};
