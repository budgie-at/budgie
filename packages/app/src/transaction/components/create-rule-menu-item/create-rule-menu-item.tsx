import { UserIconNameEnum } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { selectSuggestConditions } from '@budgie/rules';
import { t } from '@lingui/core/macro';

import { PopoverMenuItem } from '../../../@generic/component/popover-menu-item/popover-menu-item';
import { useRuleFormModal } from '../../../rule/context/rule-form-modal.context';
import { useTransactionActionsMenu } from '../../context/transaction-actions-menu.context';
import { TransactionActionsMenuSelector } from '../transaction-actions-menu/transaction-actions-menu.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const CreateRuleMenuItem = ({ transaction }: Props) => {
    const closeMenu = useTransactionActionsMenu();
    const [openRuleForm] = useRuleFormModal();

    const handleCreateRule = () => {
        const categoryEntry = getTransactionCategoryEntries(transaction.entries).at(0);

        closeMenu(() => {
            openRuleForm({
                prefillData: {
                    conditions:
                        selectSuggestConditions(transaction.title, categoryEntry?.mccCategory?.mcc ?? null, transaction.comment) ?? [],
                    categoryId: categoryEntry?.categoryId ?? null,
                    tagIds: transaction.transactionTags.map(({ tagId }) => tagId)
                }
            });
        });
    };

    return (
        <PopoverMenuItem
            icon={UserIconNameEnum.Workflow}
            label={t`Create rule`}
            onPress={handleCreateRule}
            testID={TransactionActionsMenuSelector.CreateRuleButton}
        />
    );
};
