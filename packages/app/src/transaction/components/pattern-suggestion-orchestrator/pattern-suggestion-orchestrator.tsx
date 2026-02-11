import { SuggestionStatus } from '@budgie/ai';
import { RepeatedTransactionPatternInterface, TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';

import { isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { usePatternSuggestionOrchestrator } from '../../hook/use-pattern-suggestion-orchestrator.hook';
import { useRepeatedTransactionSuggestion } from '../../hook/use-repeated-transaction-suggestion.hook';
import { PatternSuggestionOrchestratorConfig } from '../../interface/pattern-suggestion-orchestrator.interface';
import { SuggestionOrchestratorSharedProps } from '../../interface/suggestion-orchestrator-shared-props.interface';
import { SuggestionOrchestratorStepEnum } from '../../type/suggestion-orchestrator-step.enum';
import { deduplicatePatternCategories } from '../../utils/deduplicate-pattern-categories.util';
import { getPatternAverageAmount } from '../../utils/get-pattern-average-amount.util';
import { getPatternComments } from '../../utils/get-pattern-comments.util';
import { getPatternTagIds } from '../../utils/get-pattern-tag-ids.util';
import { IconTitleSuggestionRow } from '../icon-title-suggestion-row/icon-title-suggestion-row';
import { SuggestionRowSpacer } from '../suggestion-row-spacer/suggestion-row-spacer';

interface Props extends SuggestionOrchestratorSharedProps {
    readonly config: PatternSuggestionOrchestratorConfig;
}

type PatternCategorySuggestion = Pick<
    RepeatedTransactionPatternInterface,
    'categoryId' | 'categoryTitle' | 'categoryIcon' | 'occurrenceCount'
>;

const getPatternCategoryKey = (category: PatternCategorySuggestion): number => category.categoryId;
const getPatternCategoryIcon = (category: PatternCategorySuggestion) => category.categoryIcon;
const getPatternCategoryTitle = (category: PatternCategorySuggestion): string => category.categoryTitle;

const getPatternTagKey = (tag: TagEntityInterface): number => tag.id;
const getPatternTagIcon = (): UserIconNameEnum => UserIconNameEnum.Hash;
const getPatternTagTitle = (tag: TagEntityInterface): string => tag.title;

const getPatternCommentKey = (comment: string): string => comment;
const getPatternCommentIcon = (): UserIconNameEnum => UserIconNameEnum.MessageSquare;
const getPatternCommentTitle = (comment: string): string => comment;

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

    console.log(
        `[PatOrch] enabled=${patternEnabled} split=${isSplitActive} canUse=${canUsePattern} hasCat=${hasCategorySelected} accId=${accountId}`
    );

    const { suggestions: patterns, status: patternStatus } = useRepeatedTransactionSuggestion({
        enabled: patternEnabled,
        type: transactionType,
        accountId,
        amount,
        categoryId: hasCategorySelected ? safeCategoryId : 0
    });

    console.log(`[PatOrch] status=${patternStatus} patterns=${patterns.length} step will resolve next`); // eslint-disable-line no-console, lingui/no-unlocalized-strings

    const patternTagIds = hasCategorySelected ? getPatternTagIds(patterns, safeCategoryId) : [];
    const patternComments = hasCategorySelected ? getPatternComments(patterns, safeCategoryId) : [];
    const patternCategories = deduplicatePatternCategories(patterns);
    const { tags: patternTags } = useGetTagByIdsQuery(patternTagIds);
    const resolvedPatternTags = patternTags ?? [];
    const patternTagStatus: SuggestionStatus = isNotEmptyArray(resolvedPatternTags) ? patternStatus : 'loading';
    const hasPatternTags = isNotEmptyArray(patternTagIds);
    const hasPatternComments = isNotEmptyArray(patternComments);

    const step = usePatternSuggestionOrchestrator(config, {
        isSplitActive,
        canUsePattern,
        hasCategorySelected,
        hasTagsSelected,
        hasComment,
        hasPatternTags,
        hasPatternComments
    });

    console.log(
        `[PatOrch] step=${step} patternCats=${patternCategories.length} patternTags=${patternTagIds.length} patternCmts=${patternComments.length}`
    );

    const fillPatternAmount = (selectedCategoryId: number): void => {
        if (!config.autoFillAmountFromPattern) {
            return;
        }

        onFillPatternAmount(getPatternAverageAmount(patterns, selectedCategoryId));
    };

    const handleSelectPatternCategory = (selectedCategoryId: number): void => {
        onSelectCategory(selectedCategoryId);

        const categoryPatternTagIds = getPatternTagIds(patterns, selectedCategoryId);
        const categoryPatternComments = getPatternComments(patterns, selectedCategoryId);
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

    const handleSelectPatternCategorySuggestion = (category: PatternCategorySuggestion): void => {
        handleSelectPatternCategory(category.categoryId);
    };

    const handleSelectPatternTagSuggestion = (tag: TagEntityInterface): void => {
        handleSelectPatternTag(tag.id);
    };

    if (step === SuggestionOrchestratorStepEnum.CATEGORY) {
        return (
            <IconTitleSuggestionRow
                suggestions={patternCategories}
                status={patternStatus}
                enabled
                onSelect={handleSelectPatternCategorySuggestion}
                getKey={getPatternCategoryKey}
                getIcon={getPatternCategoryIcon}
                getTitle={getPatternCategoryTitle}
            />
        );
    }

    if (step === SuggestionOrchestratorStepEnum.TAG) {
        return (
            <IconTitleSuggestionRow
                suggestions={resolvedPatternTags}
                status={patternTagStatus}
                enabled
                onSelect={handleSelectPatternTagSuggestion}
                getKey={getPatternTagKey}
                getIcon={getPatternTagIcon}
                getTitle={getPatternTagTitle}
            />
        );
    }

    if (step === SuggestionOrchestratorStepEnum.COMMENT) {
        return (
            <IconTitleSuggestionRow
                suggestions={patternComments}
                status={patternStatus}
                enabled
                onSelect={handleSelectPatternComment}
                getKey={getPatternCommentKey}
                getIcon={getPatternCommentIcon}
                getTitle={getPatternCommentTitle}
            />
        );
    }

    return <SuggestionRowSpacer />;
};
