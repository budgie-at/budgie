import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';

import { RuleSuggestionPill } from '../../../rule/components/rule-suggestion-pill/rule-suggestion-pill';
import { SuggestRuleDataInterface } from '../../../rule/interface/suggest-rule-data.interface';
import { CategorySuggestionRow } from '../category-suggestion-row/category-suggestion-row';
import { SuggestionRowSpacer } from '../suggestion-row-spacer/suggestion-row-spacer';
import { TagSuggestionRow } from '../tag-suggestion-row/tag-suggestion-row';

import { PatternSuggestionRow } from './pattern-suggestion-row';

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
    readonly shouldSuggestRule?: boolean;
    readonly suggestRuleData?: SuggestRuleDataInterface;
    readonly onRuleCreated?: () => void;
    readonly onSelectCategory: (categoryId: number) => void;
    readonly onSelectTag: (tagId: number) => void;
    readonly onSelectRepeatedPattern: (pattern: RepeatedTransactionPatternInterface) => void;
}

// eslint-disable-next-line max-statements -- Conditional rendering requires multiple visibility checks
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
        shouldSuggestRule = false,
        suggestRuleData,
        onRuleCreated,
        onSelectCategory,
        onSelectTag,
        onSelectRepeatedPattern
    } = props;

    if (shouldSuggestRule && suggestRuleData && onRuleCreated) {
        return <RuleSuggestionPill suggestRuleData={suggestRuleData} onRuleCreated={onRuleCreated} />;
    }

    const safeCategoryId = categoryId ?? 0;
    const hasCategorySelected = safeCategoryId > 0;
    const hasContext = (mccCategoryId !== null && mccCategoryId > 0) || comment.length > 0 || aiContext.length > 0;

    const showRepeatedSuggestions = isNewTransaction && !hasCategorySelected && !isSplitActive;
    const showCategorySuggestions = !isNewTransaction && !hasCategorySelected && hasContext && !isSplitActive;
    const showTagSuggestions = !isNewTransaction && hasCategorySelected && !hasTagsSelected && hasContext && !isSplitActive;

    if (isSplitActive) {
        return <SuggestionRowSpacer />;
    }

    if (showTagSuggestions) {
        return (
            <TagSuggestionRow
                transactionTitle={transactionTitle}
                categoryId={safeCategoryId}
                mccCategoryId={mccCategoryId}
                comment={comment}
                aiContext={aiContext}
                enabled={showTagSuggestions}
                onSelect={onSelectTag}
            />
        );
    }

    if (showRepeatedSuggestions) {
        return (
            <PatternSuggestionRow
                transactionType={transactionType}
                accountId={accountId}
                amount={amount}
                categoryId={safeCategoryId}
                enabled={showRepeatedSuggestions}
                onSelect={onSelectRepeatedPattern}
            />
        );
    }

    if (isNewTransaction) {
        return <SuggestionRowSpacer />;
    }

    return (
        <CategorySuggestionRow
            transactionTitle={transactionTitle}
            mccCategoryId={mccCategoryId}
            comment={comment}
            aiContext={aiContext}
            enabled={showCategorySuggestions}
            onSelect={onSelectCategory}
        />
    );
};
