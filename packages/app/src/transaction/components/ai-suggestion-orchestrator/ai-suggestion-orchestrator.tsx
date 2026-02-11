import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useAiSuggestionOrchestrator } from '../../hook/use-ai-suggestion-orchestrator.hook';
import { SuggestionOrchestratorSharedProps } from '../../interface/suggestion-orchestrator-shared-props.interface';
import { SuggestionOrchestratorStepEnum } from '../../type/suggestion-orchestrator-step.enum';
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
    const hasCategorySelected = isPositiveNumber(safeCategoryId);
    const hasComment = isNotEmptyString(comment);

    const step = useAiSuggestionOrchestrator({
        isSplitActive,
        hasEmbeddingContext: hasContext,
        hasCategorySelected,
        hasTagsSelected,
        hasComment
    });

    if (step === SuggestionOrchestratorStepEnum.CATEGORY) {
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

    if (step === SuggestionOrchestratorStepEnum.TAG) {
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

    if (step === SuggestionOrchestratorStepEnum.COMMENT) {
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
