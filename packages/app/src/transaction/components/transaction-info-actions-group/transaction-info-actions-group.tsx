import { isNotEmptyArray } from '@rnw-community/shared';

import { TransactionInfoActionRow } from '../transaction-info-action-row/transaction-info-action-row';
import { TransactionInfoCreateRuleRow } from '../transaction-info-create-rule-row/transaction-info-create-rule-row';
import { TransactionInfoDeleteRow } from '../transaction-info-delete-row/transaction-info-delete-row';
import { TransactionInfoGroup } from '../transaction-info-group/transaction-info-group';
import { TransactionInfoMoreActionsRow } from '../transaction-info-more-actions-row/transaction-info-more-actions-row';

import type { TransactionActionsMenuItemInterface } from '../../interface/transaction-actions-menu-item.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly items: readonly TransactionActionsMenuItemInterface[];
    readonly onDelete: () => unknown;
}

export const TransactionInfoActionsGroup = ({ transaction, items, onDelete }: Props) => {
    const moreItems = items.filter(item => !item.isPrimary);
    const primaryItems = items.filter(item => item.isPrimary);

    return (
        <>
            {isNotEmptyArray(items) ? (
                <TransactionInfoGroup>
                    <TransactionInfoCreateRuleRow transaction={transaction} />
                    {primaryItems.map(item => (
                        <TransactionInfoActionRow
                            key={item.key}
                            icon={item.icon}
                            label={item.label}
                            onPress={item.onPress}
                            testID={item.testID}
                        />
                    ))}
                    {isNotEmptyArray(moreItems) ? <TransactionInfoMoreActionsRow items={moreItems} /> : null}
                </TransactionInfoGroup>
            ) : null}
            <TransactionInfoGroup>
                <TransactionInfoDeleteRow transaction={transaction} onDelete={onDelete} />
            </TransactionInfoGroup>
        </>
    );
};
