import { TransactionCreateInputInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useState } from 'react';
import { Control, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { hasCategoryOrTagsChanged } from '../../transaction/utils/has-category-or-tags-changed.util';
import { isExternalTransaction } from '../../transaction/utils/is-external-transaction.util';
import { useSuggestRuleModal } from '../context/suggest-rule-modal.context';
import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';
import { useGetEnabledRulesQuery } from '../query/use-get-enabled-rules.query';
import { hasMatchingRule } from '../util/has-matching-rule.util';

interface UseSuggestRuleOnUpdateOptions {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionInput: TransactionCreateInputInterface;
    readonly control: Control<TransactionCreateInputInterface>;
}

export const useSuggestRuleOnUpdate = ({ transaction, transactionInput, control }: UseSuggestRuleOnUpdateOptions) => {
    const [ruleCreatedInSession, setRuleCreatedInSession] = useState(false);
    const { rules } = useGetEnabledRulesQuery();
    const { openSuggestRuleModal } = useSuggestRuleModal();

    const watchedEntries = useWatch({ control, name: 'entries' });
    const watchedCategoryId = useWatch({ control, name: 'entries.0.categoryId' });
    const watchedTagIds = useWatch({ control, name: 'tagIds' });

    const originalCategoryId = transactionInput.entries[0]?.categoryId ?? null;

    const isExternal = isExternalTransaction(transaction);
    const hasChanges = hasCategoryOrTagsChanged(
        { categoryId: originalCategoryId, tagIds: transactionInput.tagIds },
        { categoryId: watchedCategoryId, tagIds: watchedTagIds }
    );

    const suggestRuleData: SuggestRuleDataInterface = {
        tagIds: watchedTagIds,
        title: transaction.title,
        comment: transaction.comment,
        categoryId: watchedEntries[0]?.categoryId ?? null,
        mccCode: transaction.entries[0]?.mccCategory?.mcc ?? null
    };

    const matchingRuleExists = hasMatchingRule(rules, transactionInput, suggestRuleData);
    const shouldShowAddRule = isExternal && hasChanges && !ruleCreatedInSession && !matchingRuleExists;

    const handleCreateRule = async () => {
        const result = await openSuggestRuleModal(suggestRuleData);
        if (isDefined(result) && result.created) {
            setRuleCreatedInSession(true);
        }
    };

    return { shouldShowAddRule, handleCreateRule };
};
