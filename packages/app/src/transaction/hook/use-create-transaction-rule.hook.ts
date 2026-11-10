import { getTransactionCategoryEntries } from '@budgie/ledger';
import { selectSuggestConditions } from '@budgie/rules';

import { useOpenModal } from '../../@generic/hook/use-open-modal/use-open-modal.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useCreateTransactionRule = (transaction: TransactionWithRelationsEntityInterface) => {
    const openRuleForm = useOpenModal('/rule-form');

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
