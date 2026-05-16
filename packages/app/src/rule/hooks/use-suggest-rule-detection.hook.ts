import { useState } from 'react';
import { useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { convertTransactionToInput } from '../../transaction/utils/convert-transaction-to-input.util';
import { RuleDetectionModeEnum } from '../enum/rule-detection-mode.enum';
import { useGetEnabledRulesQuery } from '../query/use-get-enabled-rules.query';
import { buildDismissKey } from '../util/build-dismiss-key.util';
import { computeDetectionMode } from '../util/compute-detection-mode.util';
import { doesRuleMatchTransaction } from '../util/does-rule-match-transaction.util';
import { extractRuleActionOutcomes } from '../util/extract-rule-action-outcomes.util';
import { hasConflictWithRuleOutcomes } from '../util/has-conflict-with-rule-outcomes.util';

import type { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';
import type { UpdateRuleDataInterface } from '../interface/update-rule-data.interface';
import type { TransactionCreateInputInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { Control } from 'react-hook-form';

type UseSuggestRuleDetectionParamsType = {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly control: Control<TransactionCreateInputInterface>;
};

type UseSuggestRuleDetectionResultType = {
    readonly mode: RuleDetectionModeEnum;
    readonly suggestRuleData: SuggestRuleDataInterface;
    readonly updateRuleData: UpdateRuleDataInterface | null;
    readonly matchingRulesCount: number;
    readonly matchingRuleIds: readonly number[];
    readonly onRuleCreated: () => void;
    readonly onDismiss: () => void;
    readonly onCreatingChange: (next: boolean) => void;
};

const dismissedSuggestions = new Set<string>();

// eslint-disable-next-line max-statements -- Detection hook with multiple derived values and dismiss tracking
export const useSuggestRuleDetection = ({ transaction, control }: UseSuggestRuleDetectionParamsType): UseSuggestRuleDetectionResultType => {
    const [isRuleCreationStarted, setIsRuleCreationStarted] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
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
    const matchingRules = enabledRules.filter(rule => doesRuleMatchTransaction(rule, transactionInput, suggestRuleData));
    const matchingRulesCount = matchingRules.length;
    const matchingRuleIds = matchingRules.map(rule => rule.id);
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
        isRuleCreationStarted,
        isCreating,
        isDismissed: isDismissed || wasPreviouslyDismissed,
        matchingRulesCount,
        hasConflictWithMatchingRules: hasConflict
    });

    const singleMatchingRule = matchingRulesCount === 1 ? matchingRules[0] : null;
    const canUpdateRule = !isCreating && !isRuleCreationStarted;

    const updateRuleData: UpdateRuleDataInterface | null =
        canUpdateRule && isDefined(singleMatchingRule) ? { ruleId: singleMatchingRule.id, categoryId, tagIds } : null;

    const onRuleCreated = () => {
        setIsRuleCreationStarted(true);
        setIsCreating(false);
    };

    const onDismiss = () => {
        dismissedSuggestions.add(dismissKey);
        setIsDismissed(true);
        setIsCreating(false);
    };

    const onCreatingChange = (next: boolean) => {
        if (next) {
            setIsRuleCreationStarted(true);
        }

        setIsCreating(next);
    };

    return { mode, suggestRuleData, updateRuleData, matchingRulesCount, matchingRuleIds, onRuleCreated, onDismiss, onCreatingChange };
};
