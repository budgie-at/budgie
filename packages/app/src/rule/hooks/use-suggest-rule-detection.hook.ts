import {
    RuleActionTypeEnum,
    RuleConditionFieldEnum,
    RuleConditionMatchTypeEnum,
    RuleWithRelationsEntityInterface
} from '@budgie/contracts';
import { useState } from 'react';
import { useWatch } from 'react-hook-form';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { convertTransactionToInput } from '../../transaction/utils/convert-transaction-to-input.util';
import { RuleDetectionModeEnum } from '../enum/rule-detection-mode.enum';
import { useGetEnabledRulesQuery } from '../query/use-get-enabled-rules.query';
import { evaluateRuleCondition, matchOperator } from '../util/evaluate-rule-condition.util';
import { selectSuggestCondition } from '../util/select-suggest-condition.util';

import type { RuleEvaluationInputInterface } from '../interface/rule-evaluation-input.interface';
import type { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';
import type { UpdateRuleDataInterface } from '../interface/update-rule-data.interface';
import type {
    RuleConditionEntityInterface,
    TransactionCreateInputInterface,
    TransactionWithRelationsEntityInterface
} from '@budgie/contracts';
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
    readonly onRuleCreated: () => void;
    readonly onDismiss: () => void;
};

type RuleActionOutcomesType = {
    readonly categoryId: number | null;
    readonly tagIds: number[];
};

type HasConflictParamsType = {
    readonly userCategoryId: number | null;
    readonly userTagIds: number[];
    readonly ruleOutcomes: RuleActionOutcomesType;
    readonly categoryChanged: boolean;
    readonly tagsChanged: boolean;
};

const getSuggestRuleFieldValue = (
    field: RuleConditionFieldEnum,
    data: Pick<SuggestRuleDataInterface, 'title' | 'comment' | 'mccCode'>
): string | null => {
    switch (field) {
        case RuleConditionFieldEnum.TITLE:
            return data.title;
        case RuleConditionFieldEnum.COMMENT:
            return data.comment;
        case RuleConditionFieldEnum.MCC_CODE:
            return data.mccCode;
        default:
            return null;
    }
};

const evaluateConditionForDetection = (
    condition: RuleConditionEntityInterface,
    transactionInput: RuleEvaluationInputInterface,
    suggestRuleData: SuggestRuleDataInterface
): boolean => {
    const suggestValue = getSuggestRuleFieldValue(condition.field, suggestRuleData);

    if (isDefined(suggestValue)) {
        return matchOperator(condition.operator, suggestValue, condition.value, condition.secondaryValue);
    }

    return evaluateRuleCondition(condition, transactionInput);
};

const doesRuleMatchTransaction = (
    rule: RuleWithRelationsEntityInterface,
    transactionInput: RuleEvaluationInputInterface,
    suggestRuleData: SuggestRuleDataInterface
): boolean => {
    if (!isNotEmptyArray(rule.conditions)) {
        return false;
    }

    const matchesCondition = (condition: RuleConditionEntityInterface) =>
        evaluateConditionForDetection(condition, transactionInput, suggestRuleData);

    return rule.conditionMatchType === RuleConditionMatchTypeEnum.ANY
        ? rule.conditions.some(matchesCondition)
        : rule.conditions.every(matchesCondition);
};

const extractRuleActionOutcomes = (matchingRules: RuleWithRelationsEntityInterface[]): RuleActionOutcomesType => {
    const allActions = matchingRules.flatMap(rule => rule.actions);

    const firstCategoryAction = allActions.find(action => action.type === RuleActionTypeEnum.SET_CATEGORY && isDefined(action.categoryId));

    const tagIds = [
        ...new Set(
            allActions
                .filter(action => action.type === RuleActionTypeEnum.ADD_TAG && isDefined(action.tagId))
                .map(action => action.tagId)
                .filter(isDefined)
        )
    ];

    return { categoryId: firstCategoryAction?.categoryId ?? null, tagIds };
};

const hasConflictWithRuleOutcomes = (params: HasConflictParamsType): boolean => {
    const { userCategoryId, userTagIds, ruleOutcomes, categoryChanged, tagsChanged } = params;

    const hasCategoryConflict = categoryChanged && isDefined(ruleOutcomes.categoryId) && userCategoryId !== ruleOutcomes.categoryId;

    const userTagIdSet = new Set(userTagIds);
    const hasTagConflict =
        tagsChanged && isNotEmptyArray(ruleOutcomes.tagIds) && ruleOutcomes.tagIds.some(tagId => !userTagIdSet.has(tagId));

    return hasCategoryConflict || hasTagConflict;
};

type DetectionModeParamsType = {
    readonly hasChanges: boolean;
    readonly ruleCreated: boolean;
    readonly isDismissed: boolean;
    readonly matchingRulesCount: number;
    readonly hasConflictWithMatchingRules: boolean;
};

const computeDetectionMode = (params: DetectionModeParamsType): RuleDetectionModeEnum => {
    const { hasChanges, ruleCreated, isDismissed, matchingRulesCount, hasConflictWithMatchingRules } = params;
    const canSuggest = hasChanges && !ruleCreated && !isDismissed;

    if (matchingRulesCount === 1 && canSuggest) {
        return RuleDetectionModeEnum.UPDATE;
    }

    if (isPositiveNumber(matchingRulesCount) && !hasConflictWithMatchingRules) {
        return RuleDetectionModeEnum.MATCH;
    }

    if (canSuggest) {
        return RuleDetectionModeEnum.SUGGEST;
    }

    if (isPositiveNumber(matchingRulesCount)) {
        return RuleDetectionModeEnum.MATCH;
    }

    return RuleDetectionModeEnum.NONE;
};

const dismissedSuggestions = new Set<string>();

const buildDismissKey = (transactionId: number, title: string, comment: string, mccCode: string | null): string => {
    const condition = selectSuggestCondition(title, mccCode, comment);
    const conditionSignature = isDefined(condition) ? `${condition.field}:${condition.value}` : 'none';

    return `${transactionId}:${conditionSignature}`;
};

// eslint-disable-next-line max-statements -- Detection hook with multiple derived values and dismiss tracking
export const useSuggestRuleDetection = ({ transaction, control }: UseSuggestRuleDetectionParamsType): UseSuggestRuleDetectionResultType => {
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
    const matchingRules = enabledRules.filter(rule => doesRuleMatchTransaction(rule, transactionInput, suggestRuleData));
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
