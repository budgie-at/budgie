import { RuleConditionFieldEnum, RuleConditionOperatorEnum } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { resolveRuleMccCode, selectSuggestConditions } from '@budgie/rules';

import { useOpenModal } from '../../@generic/hook/use-open-modal/use-open-modal.hook';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useCreateTransactionRule = (transaction: TransactionWithRelationsEntityInterface) => {
    const openRuleForm = useOpenModal('/rule-form');

    return () => {
        const categoryEntry = getTransactionCategoryEntries(transaction.entries).at(0);
        const mccCode = resolveRuleMccCode(transaction.entries);

        openRuleForm({
            prefillData: {
                conditions: selectSuggestConditions(transaction.title, mccCode, transaction.comment) ?? [
                    {
                        field: RuleConditionFieldEnum.TITLE,
                        operator: RuleConditionOperatorEnum.CONTAINS,
                        value: '',
                        secondaryValue: null
                    }
                ],
                categoryId: categoryEntry?.categoryId ?? null,
                tagIds: transaction.transactionTags.map(({ tagId }) => tagId)
            }
        });
    };
};
