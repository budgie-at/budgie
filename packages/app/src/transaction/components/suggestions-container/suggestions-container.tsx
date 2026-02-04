import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';

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
    const hasCategorySelected = safeCategoryId > 0;
    const hasContext = (mccCategoryId !== null && mccCategoryId > 0) || comment.length > 0 || aiContext.length > 0;

    const showRepeatedSuggestions = isNewTransaction && !hasCategorySelected && !isSplitActive && accountId > 0;
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
