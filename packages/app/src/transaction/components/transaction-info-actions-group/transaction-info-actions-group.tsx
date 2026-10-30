import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { useCreateTransactionRule } from '../../hook/use-create-transaction-rule.hook';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';
import { TransactionInfoActionRow } from '../transaction-info-action-row/transaction-info-action-row';
import { TransactionInfoGroup } from '../transaction-info-group/transaction-info-group';
import { TransactionInfoMoreActionsRow } from '../transaction-info-more-actions-row/transaction-info-more-actions-row';

import type { TransactionActionsMenuItemInterface } from '../../interface/transaction-actions-menu-item.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly items: readonly TransactionActionsMenuItemInterface[];
}

export const TransactionInfoActionsGroup = ({ transaction, items }: Props) => {
    const { t } = useLingui();
    const createRule = useCreateTransactionRule(transaction);
    const moreItems = items.filter(item => !item.isPrimary);
    const rowItems = moreItems.length > 1 ? items.filter(item => item.isPrimary) : items;

    return (
        <TransactionInfoGroup>
            <TransactionInfoActionRow
                icon={UserIconNameEnum.WandSparkles}
                label={t`Create rule`}
                onPress={createRule}
                testID={TransactionActionsMenuSelector.CreateRuleButton}
            />
            {rowItems.map(item => (
                <TransactionInfoActionRow key={item.key} icon={item.icon} label={item.label} onPress={item.onPress} testID={item.testID} />
            ))}
            {moreItems.length > 1 ? <TransactionInfoMoreActionsRow items={moreItems} /> : null}
        </TransactionInfoGroup>
    );
};
