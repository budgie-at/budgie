import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useCreateTransactionRule } from '../../hook/use-create-transaction-rule.hook';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';
import { TransactionInfoActionRow } from '../transaction-info-action-row/transaction-info-action-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionInfoCreateRuleRow = ({ transaction }: Props) => {
    const { t } = useLingui();
    const createRule = useCreateTransactionRule(transaction);

    return (
        <TransactionInfoActionRow
            icon={UserIconNameEnum.WandSparkles}
            label={t`Create rule`}
            onPress={createRule}
            testID={TransactionActionsMenuSelector.CreateRuleButton}
        />
    );
};
