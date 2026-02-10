import { TransactionTypeEnum } from '@budgie/contracts';
import { useMemo } from 'react';

import { isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useRepeatedTransactionSuggestion } from '../../../hook/use-repeated-transaction-suggestion.hook';
import { getPatternAverageAmount } from '../../../utils/get-pattern-average-amount.util';
import { getPatternComments } from '../../../utils/get-pattern-comments.util';
import { getPatternTagIds } from '../../../utils/get-pattern-tag-ids.util';
import { SuggestionRowSpacer } from '../../suggestion-row-spacer/suggestion-row-spacer';
import { CategorySuggestionRow } from '../category-suggestion-row';
import { CommentSuggestionRow } from '../comment-suggestion-row';
import { PatternCategorySuggestionRow } from '../pattern-category-suggestion-row';
import { PatternCommentSuggestionRow } from '../pattern-comment-suggestion-row';
import { PatternTagSuggestionRow } from '../pattern-tag-suggestion-row';
import { TagSuggestionRow } from '../tag-suggestion-row';

import { SuggestionOrchestratorPolicy, SuggestionSourceEnum, SuggestionStageEnum } from './suggestion-orchestrator.type';
import { useSuggestionOrchestrator } from './use-suggestion-orchestrator.hook';

export interface SuggestionOrchestratorSharedProps {
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

interface SuggestionOrchestratorBaseProps extends SuggestionOrchestratorSharedProps {
    readonly policy: SuggestionOrchestratorPolicy;
}

const getHasContext = (
    transactionTitle: string,
    mccCategoryId: number | null,
    comment: string,
    aiContext: string
): boolean =>
    isNotEmptyString(transactionTitle) || isPositiveNumber(mccCategoryId) || isNotEmptyString(comment) || isNotEmptyString(aiContext);

// eslint-disable-next-line max-lines-per-function, max-statements -- Orchestrates staged suggestions across AI and pattern sources
export const SuggestionOrchestratorBase = (props: SuggestionOrchestratorBaseProps) => {
    const {
        policy,
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
    const hasEmbeddingContext = getHasContext(transactionTitle, mccCategoryId, comment, aiContext);
    const hasComment = isNotEmptyString(comment);
    const canUsePattern = isPositiveNumber(accountId);

    const patternEnabled = !isSplitActive && canUsePattern && (policy.loadPatternBeforeCategorySelection || hasCategorySelected);
    const { suggestions: patterns, status: patternStatus } = useRepeatedTransactionSuggestion({
        enabled: patternEnabled,
        type: transactionType,
        accountId,
        amount,
        categoryId: hasCategorySelected ? safeCategoryId : 0
    });

    const patternTagIds = hasCategorySelected ? getPatternTagIds(patterns, safeCategoryId) : [];
    const patternComments = hasCategorySelected ? getPatternComments(patterns, safeCategoryId) : [];
    const hasPatternTags = isNotEmptyArray(patternTagIds);
    const hasPatternComments = isNotEmptyArray(patternComments);

    const facts = useMemo(
        () => ({
            isSplitActive,
            hasEmbeddingContext,
            hasCategorySelected,
            hasTagsSelected,
            hasComment,
            canUsePattern,
            hasPatternTags,
            hasPatternComments
        }),
        [
            isSplitActive,
            hasEmbeddingContext,
            hasCategorySelected,
            hasTagsSelected,
            hasComment,
            canUsePattern,
            hasPatternTags,
            hasPatternComments
        ]
    );

    const stage = useSuggestionOrchestrator(policy, facts);

    const fillPatternAmount = (selectedCategoryId: number): void => {
        if (!policy.autoFillAmountFromPattern) {
            return;
        }

        onFillPatternAmount(getPatternAverageAmount(patterns, selectedCategoryId));
    };

    const handleSelectPatternCategory = (selectedCategoryId: number): void => {
        onSelectCategory(selectedCategoryId);

        const categoryPatternTagIds = getPatternTagIds(patterns, selectedCategoryId);
        const categoryPatternComments = getPatternComments(patterns, selectedCategoryId);
        const hasAiTagStage = policy.tagSources.includes(SuggestionSourceEnum.AI) && hasEmbeddingContext;
        const hasPatternTagStage = policy.tagSources.includes(SuggestionSourceEnum.PATTERN) && isNotEmptyArray(categoryPatternTagIds);
        const hasNextTagStage = hasAiTagStage || hasPatternTagStage;
        const hasAiCommentStage = policy.commentSources.includes(SuggestionSourceEnum.AI) && hasEmbeddingContext && !hasComment;
        const hasPatternCommentStage =
            policy.commentSources.includes(SuggestionSourceEnum.PATTERN) &&
            policy.allowPatternComments &&
            !hasComment &&
            isNotEmptyArray(categoryPatternComments);
        const hasNextCommentStage = !hasNextTagStage && (hasAiCommentStage || hasPatternCommentStage);
        const hasNextStage = hasNextTagStage || hasNextCommentStage;

        if (!hasNextStage) {
            fillPatternAmount(selectedCategoryId);
        }
    };

    const handleSelectPatternTag = (tagId: number): void => {
        onSelectTag(tagId);

        const hasAiCommentStage = policy.commentSources.includes(SuggestionSourceEnum.AI) && hasEmbeddingContext && !hasComment;
        const hasPatternCommentStage =
            policy.commentSources.includes(SuggestionSourceEnum.PATTERN) && policy.allowPatternComments && !hasComment && hasPatternComments;
        const hasCommentStage = hasAiCommentStage || hasPatternCommentStage;
        if (!hasCommentStage) {
            fillPatternAmount(safeCategoryId);
        }
    };

    const handleSelectPatternComment = (selectedComment: string): void => {
        onSelectComment(selectedComment);
        fillPatternAmount(safeCategoryId);
    };

    if (stage === SuggestionStageEnum.CATEGORY_AI) {
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

    if (stage === SuggestionStageEnum.CATEGORY_PATTERN) {
        return <PatternCategorySuggestionRow patterns={patterns} status={patternStatus} enabled onSelect={handleSelectPatternCategory} />;
    }

    if (stage === SuggestionStageEnum.TAG_AI) {
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

    if (stage === SuggestionStageEnum.TAG_PATTERN) {
        return (
            <PatternTagSuggestionRow
                patterns={patterns}
                categoryId={safeCategoryId}
                status={patternStatus}
                enabled
                onSelect={handleSelectPatternTag}
            />
        );
    }

    if (stage === SuggestionStageEnum.COMMENT_PATTERN) {
        return (
            <PatternCommentSuggestionRow
                patterns={patterns}
                categoryId={safeCategoryId}
                status={patternStatus}
                enabled
                onSelect={handleSelectPatternComment}
            />
        );
    }

    if (stage === SuggestionStageEnum.COMMENT_AI) {
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
