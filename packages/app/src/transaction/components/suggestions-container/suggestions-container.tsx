import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';

import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { SuggestionRowSpacer } from '../suggestion-row-spacer/suggestion-row-spacer';

import { CategorySuggestionRow } from './category-suggestion-row';
import { PatternSuggestionRow } from './pattern-suggestion-row';
import { TagSuggestionRow } from './tag-suggestion-row';

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
        onSelectCategory,
        onSelectTag,
        onSelectRepeatedPattern
    } = props;

    const safeCategoryId = categoryId ?? 0;
    const hasCategorySelected = isPositiveNumber(safeCategoryId);
    const hasContext =
        isNotEmptyString(transactionTitle) || isPositiveNumber(mccCategoryId) || isNotEmptyString(comment) || isNotEmptyString(aiContext);

    const showRepeatedSuggestions = isNewTransaction && !hasCategorySelected && !isSplitActive;
    const showCategorySuggestions = !isNewTransaction && !hasCategorySelected && hasContext && !isSplitActive;
    const showTagSuggestions = !isNewTransaction && hasCategorySelected && !hasTagsSelected && hasContext && !isSplitActive;

    // eslint-disable-next-line no-console
    console.log('[SuggestionsContainer]', {
        isNewTransaction,
        categoryId,
        safeCategoryId,
        hasCategorySelected,
        hasContext,
        isSplitActive,
        showCategorySuggestions,
        showTagSuggestions,
        showRepeatedSuggestions,
        transactionTitle,
        mccCategoryId,
        comment: comment?.slice(0, 20),
        aiContext: aiContext?.slice(0, 20)
    });

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
