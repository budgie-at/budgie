import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useTransactionActionsMenu } from '../../context/transaction-actions-menu.context';
import { useCreateTransactionRule } from '../../hook/use-create-transaction-rule.hook';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const CreateRuleMenuItem = ({ transaction }: Props) => {
    const closeMenu = useTransactionActionsMenu();
    const createRule = useCreateTransactionRule(transaction);
    const handleCreateRule = () => void closeMenu(createRule);

    return (
        <PopoverMenuItem
            icon={UserIconNameEnum.Workflow}
            label={t`Create rule`}
            onPress={handleCreateRule}
            testID={TransactionActionsMenuSelector.CreateRuleButton}
        />
    );
};
