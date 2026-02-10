import { TransactionTypeEnum } from '@budgie/contracts';

import { isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useRepeatedTransactionSuggestion } from '../../hook/use-repeated-transaction-suggestion.hook';
import { getPatternAverageAmount } from '../../utils/get-pattern-average-amount.util';
import { getPatternComments } from '../../utils/get-pattern-comments.util';
import { getPatternTagIds } from '../../utils/get-pattern-tag-ids.util';
import { SuggestionRowSpacer } from '../suggestion-row-spacer/suggestion-row-spacer';

import { CategorySuggestionRow } from './category-suggestion-row';
import { PatternCategorySuggestionRow } from './pattern-category-suggestion-row';
import { PatternCommentSuggestionRow } from './pattern-comment-suggestion-row';
import { PatternTagSuggestionRow } from './pattern-tag-suggestion-row';
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
    readonly onSelectComment: (comment: string) => void;
    readonly onFillPatternAmount: (amount: number) => void;
}

// eslint-disable-next-line max-statements, max-lines-per-function, complexity -- Progressive suggestion phases require multiple visibility checks
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
        onSelectComment,
        onFillPatternAmount
    } = props;

    const safeCategoryId = categoryId ?? 0;
    const hasCategorySelected = isPositiveNumber(safeCategoryId);
    const hasContext =
        isNotEmptyString(transactionTitle) || isPositiveNumber(mccCategoryId) || isNotEmptyString(comment) || isNotEmptyString(aiContext);

    const hasAiContext = isNotEmptyString(aiContext);
    const patternEnabled = isNewTransaction && !hasAiContext && !isSplitActive;
    const { suggestions: patterns, status: patternStatus } = useRepeatedTransactionSuggestion({
        enabled: patternEnabled,
        type: transactionType,
        accountId,
        amount,
        categoryId: 0
    });

    const patternTagIds = hasCategorySelected ? getPatternTagIds(patterns, safeCategoryId) : [];
    const patternComments = hasCategorySelected ? getPatternComments(patterns, safeCategoryId) : [];
    const hasPatternTags = isNotEmptyArray(patternTagIds);
    const hasPatternComments = isNotEmptyArray(patternComments);
    const hasComment = isNotEmptyString(comment);

    const showAiCategories = isNewTransaction && !hasCategorySelected && hasAiContext && !isSplitActive;
    const showPatternCategories = isNewTransaction && !hasCategorySelected && !hasAiContext && !isSplitActive;
    const showPatternTags = isNewTransaction && hasCategorySelected && !hasTagsSelected && hasPatternTags && !isSplitActive;
    const showPatternComments =
        isNewTransaction &&
        hasCategorySelected &&
        !hasComment &&
        hasPatternComments &&
        (hasTagsSelected || !hasPatternTags) &&
        !isSplitActive;

    const isTagLastPhase = !hasPatternComments;

    const handleSelectPatternCategory = (selectedCategoryId: number): void => {
        onSelectCategory(selectedCategoryId);

        const categoryPatternTagIds = getPatternTagIds(patterns, selectedCategoryId);
        const categoryPatternComments = getPatternComments(patterns, selectedCategoryId);
        const hasNextPhase = isNotEmptyArray(categoryPatternTagIds) || isNotEmptyArray(categoryPatternComments);

        if (!hasNextPhase) {
            onFillPatternAmount(getPatternAverageAmount(patterns, selectedCategoryId));
        }
    };

    const handleSelectPatternTag = (tagId: number): void => {
        onSelectTag(tagId);

        if (isTagLastPhase) {
            onFillPatternAmount(getPatternAverageAmount(patterns, safeCategoryId));
        }
    };

    const handleSelectPatternComment = (selectedComment: string): void => {
        onSelectComment(selectedComment);
        onFillPatternAmount(getPatternAverageAmount(patterns, safeCategoryId));
    };

    const showCategorySuggestions = !isNewTransaction && !hasCategorySelected && hasContext && !isSplitActive;
    const showTagSuggestions = !isNewTransaction && hasCategorySelected && !hasTagsSelected && hasContext && !isSplitActive;

    if (isSplitActive) {
        return <SuggestionRowSpacer />;
    }

    if (showAiCategories) {
        return (
            <CategorySuggestionRow
                transactionTitle={transactionTitle}
                mccCategoryId={mccCategoryId}
                comment={comment}
                aiContext={aiContext}
                enabled={showAiCategories}
                onSelect={onSelectCategory}
            />
        );
    }

    if (showPatternCategories) {
        return (
            <PatternCategorySuggestionRow
                patterns={patterns}
                status={patternStatus}
                enabled={showPatternCategories}
                onSelect={handleSelectPatternCategory}
            />
        );
    }

    if (showPatternTags) {
        return (
            <PatternTagSuggestionRow
                patterns={patterns}
                categoryId={safeCategoryId}
                status={patternStatus}
                enabled={showPatternTags}
                onSelect={handleSelectPatternTag}
            />
        );
    }

    if (showPatternComments) {
        return (
            <PatternCommentSuggestionRow
                patterns={patterns}
                categoryId={safeCategoryId}
                status={patternStatus}
                enabled={showPatternComments}
                onSelect={handleSelectPatternComment}
            />
        );
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
