import { UserIconNameEnum } from '@budgie/contracts';
import { getTransactionFeeEntries } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { useCreateTransactionRule } from '../../hook/use-create-transaction-rule.hook';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';
import { TransactionInfoActionRow } from '../transaction-info-action-row/transaction-info-action-row';
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
    const { t } = useLingui();
    const createRule = useCreateTransactionRule(transaction);
    const hasFee = isNotEmptyArray(getTransactionFeeEntries(transaction.entries));
    const pageItems = items.filter(item => !hasFee || item.testID !== TransactionActionsMenuSelector.FeeButton);
    const moreItems = pageItems.filter(item => !item.isPrimary);
    const primaryItems = pageItems.filter(item => item.isPrimary);
    const deleteRow = <TransactionInfoDeleteRow transaction={transaction} onDelete={onDelete} />;
    const actionRows = (
        <>
            <TransactionInfoActionRow
                icon={UserIconNameEnum.WandSparkles}
                label={t`Create rule`}
                onPress={createRule}
                testID={TransactionActionsMenuSelector.CreateRuleButton}
            />
            {primaryItems.map(item => (
                <TransactionInfoActionRow key={item.key} icon={item.icon} label={item.label} onPress={item.onPress} testID={item.testID} />
            ))}
            {isNotEmptyArray(moreItems) ? <TransactionInfoMoreActionsRow items={moreItems} /> : null}
        </>
    );

    if (isEmptyArray(primaryItems) && isEmptyArray(moreItems)) {
        return (
            <TransactionInfoGroup>
                {actionRows}
                {deleteRow}
            </TransactionInfoGroup>
        );
    }

    return (
        <>
            <TransactionInfoGroup>{actionRows}</TransactionInfoGroup>
            <TransactionInfoGroup>{deleteRow}</TransactionInfoGroup>
        </>
    );
};
