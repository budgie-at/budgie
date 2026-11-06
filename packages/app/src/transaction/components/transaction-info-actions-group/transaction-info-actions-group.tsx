import { TransactionTypeEnum } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

import { TransactionInfoActionRow } from '../transaction-info-action-row/transaction-info-action-row';
import { TransactionInfoCreateRuleRow } from '../transaction-info-create-rule-row/transaction-info-create-rule-row';
import { TransactionInfoDeleteRow } from '../transaction-info-delete-row/transaction-info-delete-row';
import { TransactionInfoGroup } from '../transaction-info-group/transaction-info-group';
import { TransactionInfoMoreActionsRow } from '../transaction-info-more-actions-row/transaction-info-more-actions-row';
import { TransactionInfoRecurringRow } from '../transaction-info-recurring-row/transaction-info-recurring-row';

import type { TransactionActionsMenuItemInterface } from '../../interface/transaction-actions-menu-item.interface';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly items: readonly TransactionActionsMenuItemInterface[];
    readonly onDelete: () => unknown;
}

export const TransactionInfoActionsGroup = ({ transaction, items, onDelete }: Props) => {
    const isRecurringEligible = transaction.type === TransactionTypeEnum.EXPENSE || transaction.type === TransactionTypeEnum.INCOME;
    const moreItems = items.filter(item => !item.isPrimary);
    const primaryItems = items.filter(item => item.isPrimary);

    return (
        <>
            <TransactionInfoGroup>
                <TransactionInfoCreateRuleRow transaction={transaction} />
                {isRecurringEligible ? <TransactionInfoRecurringRow transactionId={transaction.id} /> : null}
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
            <TransactionInfoGroup>
                <TransactionInfoDeleteRow transaction={transaction} onDelete={onDelete} />
            </TransactionInfoGroup>
        </>
    );
};
