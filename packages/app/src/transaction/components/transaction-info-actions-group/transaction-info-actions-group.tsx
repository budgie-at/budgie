import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useCreateTransactionRule } from '../../hook/use-create-transaction-rule.hook';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';
import { TransactionInfoActionRow } from '../transaction-info-action-row/transaction-info-action-row';
import { TransactionInfoGroup } from '../transaction-info-group/transaction-info-group';

import type { TransactionActionsMenuItemInterface } from '../../interface/transaction-actions-menu-item.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly items: readonly TransactionActionsMenuItemInterface[];
    readonly onRevert: () => void;
}

export const TransactionInfoActionsGroup = ({ transaction, items, onRevert }: Props) => {
    const { t } = useLingui();
    const createRule = useCreateTransactionRule(transaction);

    return (
        <TransactionInfoGroup>
            <TransactionInfoActionRow
                label={t`Create rule`}
                onPress={createRule}
                testID={TransactionActionsMenuSelector.CreateRuleButton}
            />
            {items.map(item => (
                <TransactionInfoActionRow key={item.key} label={item.label} onPress={item.onPress} testID={item.testID} />
            ))}
            {isDefined(transaction.consolidationType) ? (
                <TransactionInfoActionRow label={t`Revert`} onPress={onRevert} testID={TransactionActionsMenuSelector.RevertButton} />
            ) : null}
        </TransactionInfoGroup>
    );
};
