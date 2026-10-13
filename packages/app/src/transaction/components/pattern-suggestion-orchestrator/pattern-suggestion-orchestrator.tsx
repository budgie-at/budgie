import { SuggestionStatus } from '@budgie/ai';
import { UserIconNameEnum } from '@budgie/contracts';

import { isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { useRepeatedTransactionSuggestion } from '../../hook/use-repeated-transaction-suggestion.hook';
import { PatternSuggestionOrchestratorConfig } from '../../interface/pattern-suggestion-orchestrator-config.type';
import { SuggestionOrchestratorSharedProps } from '../../interface/suggestion-orchestrator-shared-props.type';
import { getLatestPatternAmount } from '../../utils/get-latest-pattern-amount.util';
import { getPatternComments } from '../../utils/get-pattern-comments.util';
import { getPatternTagIds } from '../../utils/get-pattern-tag-ids.util';
import { mergePatternCategories } from '../../utils/merge-pattern-categories.util';
import { IconTitleSuggestionRow } from '../icon-title-suggestion-row/icon-title-suggestion-row';
import { IconTitleSuggestionRowSelector } from '../icon-title-suggestion-row/icon-title-suggestion-row.selector';
import { SuggestionRowSpacer } from '../suggestion-row-spacer/suggestion-row-spacer';

interface Props extends SuggestionOrchestratorSharedProps {
    readonly config: PatternSuggestionOrchestratorConfig;
}

// eslint-disable-next-line max-lines-per-function, max-statements -- Pattern stage orchestration includes fetching, stage resolution, and final selection handlers
export const PatternSuggestionOrchestrator = (props: Props) => {
    const {
        config,
        isSplitActive,
        transactionType,
        categoryId,
        comment,
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
    const canUsePattern = isPositiveNumber(accountId);
    const hasComment = isNotEmptyString(comment);

    const patternEnabled = !isSplitActive && canUsePattern && (config.loadPatternBeforeCategorySelection || hasCategorySelected);

    const {
        timePatterns,
        amountPatterns,
        status: patternStatus
    } = useRepeatedTransactionSuggestion({
        enabled: patternEnabled,
        type: transactionType,
        accountId,
        amount,
        categoryId: hasCategorySelected ? safeCategoryId : 0
    });

    const allPatterns = [...timePatterns, ...amountPatterns];
    const patternTagIds = hasCategorySelected ? getPatternTagIds(allPatterns, safeCategoryId) : [];
    const patternComments = hasCategorySelected ? getPatternComments(allPatterns, safeCategoryId) : [];
    const patternCategories = mergePatternCategories(timePatterns, amountPatterns);
    const { tags: patternTags } = useGetTagByIdsQuery(patternTagIds);
    const resolvedPatternTags = patternTags ?? [];
    const patternTagStatus: SuggestionStatus = isNotEmptyArray(resolvedPatternTags) ? patternStatus : 'loading';
    const hasPatternTags = isNotEmptyArray(patternTagIds);
    const hasPatternComments = isNotEmptyArray(patternComments);

    const isStageActive = !isSplitActive && canUsePattern;

    const fillPatternAmount = (selectedCategoryId: number): void => {
        if (!config.autoFillAmountFromPattern) {
            return;
        }

        onFillPatternAmount(getLatestPatternAmount(allPatterns, selectedCategoryId));
    };

    const handleSelectPatternCategory = (selectedCategoryId: number): void => {
        onSelectCategory(selectedCategoryId);

        const categoryPatternTagIds = getPatternTagIds(allPatterns, selectedCategoryId);
        const categoryPatternComments = getPatternComments(allPatterns, selectedCategoryId);
        const hasNextTagStep = isNotEmptyArray(categoryPatternTagIds);
        const hasNextCommentStep =
            !hasNextTagStep && !hasComment && config.allowPatternComments && isNotEmptyArray(categoryPatternComments);

        if (!hasNextTagStep && !hasNextCommentStep) {
            fillPatternAmount(selectedCategoryId);
        }
    };

    const handleSelectPatternTag = (tagId: number): void => {
        onSelectTag(tagId);

        const hasNextCommentStep = !hasComment && config.allowPatternComments && hasPatternComments;
        if (!hasNextCommentStep) {
            fillPatternAmount(safeCategoryId);
        }
    };

    const handleSelectPatternComment = (selectedComment: string): void => {
        onSelectComment(selectedComment);
        fillPatternAmount(safeCategoryId);
    };

    if (isStageActive && !hasCategorySelected && config.loadPatternBeforeCategorySelection) {
        return (
            <IconTitleSuggestionRow
                items={patternCategories.map(category => ({
                    key: category.categoryId,
                    icon: category.categoryIcon,
                    title: category.categoryTitle,
                    onSelect: () => void handleSelectPatternCategory(category.categoryId)
                }))}
                status={patternStatus}
                enabled
                testIDPrefix={IconTitleSuggestionRowSelector.PatternCategory}
            />
        );
    }

    if (isStageActive && hasCategorySelected && !hasTagsSelected && hasPatternTags) {
        return (
            <IconTitleSuggestionRow
                items={resolvedPatternTags.map(tag => ({
                    key: tag.id,
                    icon: UserIconNameEnum.Hash,
                    title: tag.title,
                    onSelect: () => void handleSelectPatternTag(tag.id)
                }))}
                status={patternTagStatus}
                enabled
                testIDPrefix={IconTitleSuggestionRowSelector.PatternTag}
            />
        );
    }

    if (isStageActive && hasCategorySelected && !hasComment && config.allowPatternComments && hasPatternComments) {
        return (
            <IconTitleSuggestionRow
                items={patternComments.map(patternComment => ({
                    key: patternComment,
                    icon: UserIconNameEnum.MessageSquare,
                    title: patternComment,
                    onSelect: () => void handleSelectPatternComment(patternComment)
                }))}
                status={patternStatus}
                enabled
                testIDPrefix={IconTitleSuggestionRowSelector.PatternComment}
            />
        );
    }

    return <SuggestionRowSpacer />;
};
