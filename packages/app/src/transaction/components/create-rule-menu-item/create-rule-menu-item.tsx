import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { useCreateTransactionRule } from '../../hook/use-create-transaction-rule.hook';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const CreateRuleMenuItem = ({ transaction }: Props) => {
    const createRule = useCreateTransactionRule(transaction);

    return (
        <ActionsMenuItem
            icon={UserIconNameEnum.Workflow}
            label={t`Create rule`}
            onPress={createRule}
            testID={TransactionActionsMenuSelector.CreateRuleButton}
        />
    );
};
