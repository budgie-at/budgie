import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { SuggestionOrchestratorSharedProps } from '../../interface/suggestion-orchestrator-shared-props.type';
import { CategorySuggestionRow } from '../category-suggestion-row/category-suggestion-row';
import { CommentSuggestionRow } from '../comment-suggestion-row/comment-suggestion-row';
import { SuggestionRowSpacer } from '../suggestion-row-spacer/suggestion-row-spacer';
import { TagSuggestionRow } from '../tag-suggestion-row/tag-suggestion-row';

const hasEmbeddingContext = (transactionTitle: string, mccCategoryId: number | null, comment: string, aiContext: string): boolean =>
    isNotEmptyString(transactionTitle) || isPositiveNumber(mccCategoryId) || isNotEmptyString(comment) || isNotEmptyString(aiContext);

export const AiSuggestionOrchestrator = (props: SuggestionOrchestratorSharedProps) => {
    const {
        isSplitActive,
        transactionTitle,
        categoryId,
        isCategoryUserConfirmed,
        mccCategoryId,
        comment,
        aiContext,
        hasTagsSelected,
        onSelectCategory,
        onSelectTag,
        onSelectComment
    } = props;

    const safeCategoryId = categoryId ?? 0;
    const hasContext = hasEmbeddingContext(transactionTitle, mccCategoryId, comment, aiContext);
    const hasCategorySelected = isPositiveNumber(safeCategoryId) && isCategoryUserConfirmed;
    const hasComment = isNotEmptyString(comment);

    const isStageActive = !isSplitActive && hasContext;

    if (isStageActive && !hasCategorySelected) {
        return (
            <CategorySuggestionRow
                transactionTitle={transactionTitle}
                mccCategoryId={mccCategoryId}
                comment={comment}
                aiContext={aiContext}
                enabled
                onSelect={onSelectCategory}
            />
        );
    }

    if (isStageActive && !hasTagsSelected) {
        return (
            <TagSuggestionRow
                transactionTitle={transactionTitle}
                categoryId={safeCategoryId}
                mccCategoryId={mccCategoryId}
                comment={comment}
                aiContext={aiContext}
                enabled
                onSelect={onSelectTag}
            />
        );
    }

    if (isStageActive && !hasComment) {
        return (
            <CommentSuggestionRow
                transactionTitle={transactionTitle}
                categoryId={safeCategoryId}
                mccCategoryId={mccCategoryId}
                comment={comment}
                aiContext={aiContext}
                enabled
                onSelect={onSelectComment}
            />
        );
    }

    return <SuggestionRowSpacer />;
};
