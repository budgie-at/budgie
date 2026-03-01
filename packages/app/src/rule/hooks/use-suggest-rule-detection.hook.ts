import {
    RuleWithRelationsEntityInterface,
    TransactionCreateInputInterface,
    TransactionWithRelationsEntityInterface
} from '@budgie/contracts';
import { useState } from 'react';
import { Control, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { convertTransactionToInput } from '../../transaction/utils/convert-transaction-to-input.util';
import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';
import { useGetEnabledRulesQuery } from '../query/use-get-enabled-rules.query';
import { RuleDetectionModeType } from '../type/rule-detection-mode.type';
import { computeDetectionMode } from '../util/compute-detection-mode.util';
import { findMatchingRule } from '../util/find-matching-rule.util';

interface UseSuggestRuleDetectionParams {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly control: Control<TransactionCreateInputInterface>;
}

interface UseSuggestRuleDetectionResult {
    readonly mode: RuleDetectionModeType;
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly matchingRule: RuleWithRelationsEntityInterface | undefined;
    readonly onRuleCreated: () => void;
}

// eslint-disable-next-line max-statements -- Detection hook with multiple derived values
export const useSuggestRuleDetection = ({ transaction, control }: UseSuggestRuleDetectionParams): UseSuggestRuleDetectionResult => {
    const [ruleCreated, setRuleCreated] = useState(false);
    const entries = useWatch({ control, name: 'entries' });
    const tagIds = useWatch({ control, name: 'tagIds' });
    const { enabledRules } = useGetEnabledRulesQuery();

    const categoryId = entries[0]?.categoryId ?? null;

    const isBankSynced = isDefined(transaction.externalSource);
    const originalCategoryId = transaction.entries[0]?.categoryId ?? null;
    const originalTagIds = transaction.transactionTags.map(({ tagId }) => tagId);

    const categoryChanged = isDefined(categoryId) && categoryId !== originalCategoryId;
    const sortedTagIds = [...tagIds].sort();
    const sortedOriginalTagIds = [...originalTagIds].sort();
    const tagsChanged =
        sortedTagIds.length !== sortedOriginalTagIds.length || sortedTagIds.some((id, index) => id !== sortedOriginalTagIds[index]);

    const mccCategory = transaction.entries[0]?.mccCategory ?? null;

    const suggestRuleData: SuggestRuleDataInterface = {
        title: transaction.title,
        comment: transaction.comment,
        mccCode: isDefined(mccCategory) ? mccCategory.mcc : null,
        categoryId,
        tagIds
    };

    const transactionInput = convertTransactionToInput(transaction);
    const matchingRule = findMatchingRule(enabledRules, transactionInput, suggestRuleData);
    const { appliedRule } = transaction;
    const hasChanges = categoryChanged || tagsChanged;

    const mode = computeDetectionMode({ isBankSynced, hasChanges, ruleCreated, matchingRule, appliedRule });

    const onRuleCreated = () => {
        setRuleCreated(true);
    };

    const resolvedRule = matchingRule ?? (isDefined(appliedRule) ? appliedRule : matchingRule);

    return { mode, suggestRuleData, matchingRule: resolvedRule, onRuleCreated };
};
