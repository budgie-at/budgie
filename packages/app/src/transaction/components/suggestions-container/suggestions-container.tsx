import { RepeatedTransactionPatternInterface, RuleWithRelationsEntityInterface, TransactionTypeEnum } from '@budgie/contracts';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useLlmContext } from '../../../ai/context/llm.context';
import { RuleMatchPill } from '../../../rule/components/rule-match-pill/rule-match-pill';
import { RuleSuggestionPill } from '../../../rule/components/rule-suggestion-pill/rule-suggestion-pill';
import { SuggestRuleDataInterface } from '../../../rule/interface/suggest-rule-data.interface';
import { RuleDetectionModeType } from '../../../rule/type/rule-detection-mode.type';
import { BuildAiSuggestionRowParamsInterface } from '../../interface/build-ai-suggestion-row-params.interface';
import { CategorySuggestionRow } from '../category-suggestion-row/category-suggestion-row';
import { PatternSuggestionRow } from '../pattern-suggestion-row/pattern-suggestion-row';
import { RulePillSlot } from '../rule-pill-slot/rule-pill-slot';
import { SuggestionRowSpacer } from '../suggestion-row-spacer/suggestion-row-spacer';
import { TagSuggestionRow } from '../tag-suggestion-row/tag-suggestion-row';

interface Props {
    readonly isNewTransaction: boolean;
    readonly isSplitActive: boolean;
    readonly transactionType: TransactionTypeEnum;
    readonly transactionTitle: string;
    readonly categoryId: number | null;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly accountId: number;
    readonly amount: number;
    readonly hasTagsSelected: boolean;
    readonly ruleDetectionMode?: RuleDetectionModeType;
    readonly suggestRuleData?: SuggestRuleDataInterface;
    readonly matchingRule?: RuleWithRelationsEntityInterface;
    readonly onRuleCreated?: () => void;
    readonly onSelectCategory: (categoryId: number) => void;
    readonly onSelectTag: (tagId: number) => void;
    readonly onSelectRepeatedPattern: (pattern: RepeatedTransactionPatternInterface) => void;
}

const buildAiSuggestionRow = (params: BuildAiSuggestionRowParamsInterface): ReactNode => {
    if (params.showTagSuggestions) {
        return (
            <TagSuggestionRow
                transactionTitle={params.transactionTitle}
                categoryId={params.safeCategoryId}
                mccCategoryId={params.mccCategoryId}
                comment={params.comment}
                aiContext={params.aiContext}
                enabled={params.showTagSuggestions}
                onSelect={params.onSelectTag}
            />
        );
    }

    if (params.showRepeatedSuggestions) {
        return (
            <PatternSuggestionRow
                transactionType={params.transactionType}
                accountId={params.accountId}
                amount={params.amount}
                categoryId={params.safeCategoryId}
                enabled={params.showRepeatedSuggestions}
                onSelect={params.onSelectRepeatedPattern}
            />
        );
    }

    if (params.showCategorySuggestions) {
        return (
            <CategorySuggestionRow
                transactionTitle={params.transactionTitle}
                mccCategoryId={params.mccCategoryId}
                comment={params.comment}
                aiContext={params.aiContext}
                enabled={params.showCategorySuggestions}
                onSelect={params.onSelectCategory}
            />
        );
    }

    return null;
};

const renderStandaloneRulePill = (
    ruleDetectionMode: RuleDetectionModeType,
    suggestRuleData: SuggestRuleDataInterface | undefined,
    matchingRule: RuleWithRelationsEntityInterface | undefined,
    onRuleCreated: (() => void) | undefined
): ReactNode => {
    if (ruleDetectionMode === 'suggest' && isDefined(suggestRuleData) && isDefined(onRuleCreated)) {
        return <RuleSuggestionPill suggestRuleData={suggestRuleData} onRuleCreated={onRuleCreated} />;
    }

    if (ruleDetectionMode === 'match' && isDefined(matchingRule)) {
        return <RuleMatchPill matchingRule={matchingRule} />;
    }

    return <SuggestionRowSpacer />;
};

export const SuggestionsContainer = (props: Props) => {
    const {
        isNewTransaction,
        isSplitActive,
        transactionType,
        transactionTitle,
        categoryId,
        mccCategoryId,
        comment,
        aiContext,
        accountId,
        amount,
        hasTagsSelected,
        ruleDetectionMode = 'none',
        suggestRuleData,
        matchingRule,
        onRuleCreated,
        onSelectCategory,
        onSelectTag,
        onSelectRepeatedPattern
    } = props;

    const { isAvailable: isAiAvailable } = useLlmContext();

    const safeCategoryId = categoryId ?? 0;
    const hasCategorySelected = safeCategoryId > 0;
    const hasContext = isPositiveNumber(mccCategoryId) || isNotEmptyString(comment) || isNotEmptyString(aiContext);

    const showRepeatedSuggestions = isNewTransaction && !hasCategorySelected && !isSplitActive;
    const showCategorySuggestions = !isNewTransaction && !hasCategorySelected && hasContext && !isSplitActive;
    const showTagSuggestions =
        isAiAvailable && !isNewTransaction && hasCategorySelected && !hasTagsSelected && hasContext && !isSplitActive;

    if (isSplitActive) {
        return <SuggestionRowSpacer />;
    }

    const aiSuggestionRow = buildAiSuggestionRow({
        showTagSuggestions,
        showRepeatedSuggestions,
        showCategorySuggestions,
        transactionTitle,
        safeCategoryId,
        mccCategoryId,
        comment,
        aiContext,
        transactionType,
        accountId,
        amount,
        onSelectTag,
        onSelectRepeatedPattern,
        onSelectCategory
    });

    if (!isDefined(aiSuggestionRow)) {
        return renderStandaloneRulePill(ruleDetectionMode, suggestRuleData, matchingRule, onRuleCreated);
    }

    return (
        <View className="h-10 flex-row items-center overflow-hidden">
            <RulePillSlot
                ruleDetectionMode={ruleDetectionMode}
                suggestRuleData={suggestRuleData}
                matchingRule={matchingRule}
                onRuleCreated={onRuleCreated}
            />
            <View className="flex-1">{aiSuggestionRow}</View>
        </View>
    );
};
