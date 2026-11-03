import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { ActionsMenu } from '../../../@generic/component/actions-menu/actions-menu';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

import { TransactionActionsMenuSelector } from './transaction-actions-menu.selector';

import type { TransactionActionsMenuPropsInterface } from '../../interface/transaction-actions-menu-props.interface';

export const TransactionActionsMenu = ({ onDelete, onRevert, isConsolidated = false, children }: TransactionActionsMenuPropsInterface) => {
    const { t } = useLingui();
    const actionLabel = isConsolidated ? t`Separate Transactions` : t`Delete Transaction`;
    const actionIcon = isConsolidated ? UserIconNameEnum.Undo2 : UserIconNameEnum.Trash2;
    const actionTestID = isConsolidated ? TransactionActionsMenuSelector.RevertButton : TransactionActionsMenuSelector.DeleteButton;
    const handleActionPress = () => {
        if (isConsolidated) {
            onRevert?.();
        } else {
            void onDelete();
        }
    };
    const showAction = !isConsolidated || isDefined(onRevert);

    return (
        <ActionsMenu
            trigger={<CircleIcon icon={UserIconNameEnum.Ellipsis} variant="ghost" size={44} iconSize={24} border={false} />}
            accessibilityLabel={t`More actions`}
            triggerClassName="min-h-[44px] min-w-[44px] items-center justify-center active:scale-100 active:opacity-70"
            triggerTestID={TransactionActionsMenuSelector.TriggerButton}
            hitSlop={16}
            triggerSize={44}
        >
            {children}
            {showAction ? (
                <ActionsMenuItem
                    icon={actionIcon}
                    label={actionLabel}
                    onPress={handleActionPress}
                    variant="destructive"
                    testID={actionTestID}
                />
            ) : null}
        </ActionsMenu>
    );
};
