import { TransactionCreateInputInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useState } from 'react';
import { Control, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { convertTransactionToInput } from '../../transaction/utils/convert-transaction-to-input.util';
import { dismissedSuggestions } from '../constant/dismissed-suggestions.constant';
import { RuleDetectionModeEnum } from '../enum/rule-detection-mode.enum';
import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';
import { UpdateRuleDataInterface } from '../interface/update-rule-data.interface';
import { useGetEnabledRulesQuery } from '../query/use-get-enabled-rules.query';
import { computeDetectionMode } from '../util/compute-detection-mode.util';
import { extractRuleActionOutcomes } from '../util/extract-rule-action-outcomes.util';
import { findAllMatchingRules } from '../util/find-all-matching-rules.util';
import { hasConflictWithRuleOutcomes } from '../util/has-conflict-with-rule-outcomes.util';
import { selectSuggestCondition } from '../util/select-suggest-condition.util';

interface UseSuggestRuleDetectionParams {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly control: Control<TransactionCreateInputInterface>;
}

interface UseSuggestRuleDetectionResult {
    readonly mode: RuleDetectionModeEnum;
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly updateRuleData: UpdateRuleDataInterface | null;
    readonly matchingRulesCount: number;
    readonly onRuleCreated: () => void;
    readonly onDismiss: () => void;
}

const buildDismissKey = (transactionId: number, title: string, comment: string, mccCode: string | null): string => {
    const condition = selectSuggestCondition(title, mccCode, comment);
    const conditionSignature = isDefined(condition) ? `${condition.field}:${condition.value}` : 'none';

    return `${transactionId}:${conditionSignature}`;
};

// eslint-disable-next-line max-statements -- Detection hook with multiple derived values and dismiss tracking
export const useSuggestRuleDetection = ({ transaction, control }: UseSuggestRuleDetectionParams): UseSuggestRuleDetectionResult => {
    const [ruleCreated, setRuleCreated] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const entries = useWatch({ control, name: 'entries' });
    const tagIds = useWatch({ control, name: 'tagIds' });
    const { enabledRules } = useGetEnabledRulesQuery();

    const categoryId = entries[0]?.categoryId ?? null;

    const originalCategoryId = transaction.entries[0]?.categoryId ?? null;
    const originalTagIds = transaction.transactionTags.map(({ tagId }) => tagId);

    const categoryChanged = isDefined(categoryId) && categoryId !== originalCategoryId;
    const sortedTagIds = [...tagIds].sort();
    const sortedOriginalTagIds = [...originalTagIds].sort();
    const tagsChanged =
        sortedTagIds.length !== sortedOriginalTagIds.length || sortedTagIds.some((id, index) => id !== sortedOriginalTagIds[index]);

    const mccCategory = transaction.entries[0]?.mccCategory ?? null;
    const mccCode = isDefined(mccCategory) ? mccCategory.mcc : null;

    const suggestRuleData: SuggestRuleDataInterface = {
        title: transaction.title,
        comment: transaction.comment,
        mccCode,
        categoryId,
        tagIds
    };

    const transactionInput = convertTransactionToInput(transaction);
    const matchingRules = findAllMatchingRules(enabledRules, transactionInput, suggestRuleData);
    const matchingRulesCount = matchingRules.length;
    const hasChanges = categoryChanged || tagsChanged;

    const ruleActionOutcomes = extractRuleActionOutcomes(matchingRules);
    const hasConflict = hasConflictWithRuleOutcomes({
        userCategoryId: categoryId,
        userTagIds: tagIds,
        ruleOutcomes: ruleActionOutcomes,
        categoryChanged,
        tagsChanged
    });

    const dismissKey = buildDismissKey(transaction.id, transaction.title, transaction.comment, mccCode);
    const wasPreviouslyDismissed = dismissedSuggestions.has(dismissKey);

    const mode = computeDetectionMode({
        hasChanges,
        ruleCreated,
        isDismissed: isDismissed || wasPreviouslyDismissed,
        matchingRulesCount,
        hasConflictWithMatchingRules: hasConflict
    });

    const singleMatchingRule = matchingRulesCount === 1 ? matchingRules[0] : null;

    const updateRuleData: UpdateRuleDataInterface | null = isDefined(singleMatchingRule)
        ? { ruleId: singleMatchingRule.id, categoryId, tagIds }
        : null;

    const onRuleCreated = () => {
        setRuleCreated(true);
    };

    const onDismiss = () => {
        dismissedSuggestions.add(dismissKey);
        setIsDismissed(true);
    };

    return { mode, suggestRuleData, updateRuleData, matchingRulesCount, onRuleCreated, onDismiss };
};
