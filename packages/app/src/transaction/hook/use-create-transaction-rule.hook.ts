import { getTransactionCategoryEntries } from '@budgie/ledger';
import { selectSuggestConditions } from '@budgie/rules';

import { useRuleFormModal } from '../../rule/context/rule-form-modal.context';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useCreateTransactionRule = (transaction: TransactionWithRelationsEntityInterface) => {
    const [openRuleForm] = useRuleFormModal();

    return () => {
        const categoryEntry = getTransactionCategoryEntries(transaction.entries).at(0);

        openRuleForm({
            prefillData: {
                conditions: selectSuggestConditions(transaction.title, categoryEntry?.mccCategory?.mcc ?? null, transaction.comment) ?? [],
                categoryId: categoryEntry?.categoryId ?? null,
                tagIds: transaction.transactionTags.map(({ tagId }) => tagId)
            }
        });
    };
};
