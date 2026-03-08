import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';
import { ReactNode } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useLlmContext } from '../../../ai/context/llm.context';
import { BuildAiSuggestionRowParamsInterface } from '../../interface/build-ai-suggestion-row-params.interface';
import { CategorySuggestionRow } from '../category-suggestion-row/category-suggestion-row';
import { PatternSuggestionRow } from '../pattern-suggestion-row/pattern-suggestion-row';
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
        return <SuggestionRowSpacer />;
    }

    return (
        <View className="h-10 flex-row items-center overflow-hidden">
            <View className="flex-1">{aiSuggestionRow}</View>
        </View>
    );
};
