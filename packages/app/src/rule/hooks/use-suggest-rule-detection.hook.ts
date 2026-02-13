import { TransactionCreateInputInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useState } from 'react';
import { Control, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';

interface UseSuggestRuleDetectionParams {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly control: Control<TransactionCreateInputInterface>;
}

interface UseSuggestRuleDetectionResult {
    readonly shouldSuggestRule: boolean;
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly onRuleCreated: () => void;
}

export const useSuggestRuleDetection = ({ transaction, control }: UseSuggestRuleDetectionParams): UseSuggestRuleDetectionResult => {
    const [ruleCreated, setRuleCreated] = useState(false);
    const entries = useWatch({ control, name: 'entries' });
    const tagIds = useWatch({ control, name: 'tagIds' });

    const categoryId = entries[0]?.categoryId ?? null;

    const isBankSynced = isDefined(transaction.externalSource);
    const originalCategoryId = transaction.entries[0]?.categoryId ?? null;
    const originalTagIds = transaction.transactionTags.map(({ tagId }) => tagId);

    const categoryChanged = isDefined(categoryId) && categoryId !== originalCategoryId;
    const tagsChanged = JSON.stringify([...tagIds].sort()) !== JSON.stringify([...originalTagIds].sort());

    const shouldSuggestRule = isBankSynced && (categoryChanged || tagsChanged) && !ruleCreated;
    const onRuleCreated = () => {
        setRuleCreated(true);
    };

    const mccCategory = transaction.entries[0]?.mccCategory ?? null;

    const suggestRuleData: SuggestRuleDataInterface = {
        title: transaction.title,
        comment: transaction.comment,
        mccCode: isDefined(mccCategory) ? mccCategory.mcc : null,
        categoryId,
        tagIds
    };

    return { shouldSuggestRule, suggestRuleData, onRuleCreated };
};
