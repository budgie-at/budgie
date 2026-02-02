import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';

import { CategorySuggestionsRow } from '../category-suggestions-row/category-suggestions-row';
import { RepeatedTransactionSuggestionsRow } from '../repeated-transaction-suggestions-row/repeated-transaction-suggestions-row';
import { SuggestionRowSpacer } from '../suggestion-row-spacer/suggestion-row-spacer';
import { TagSuggestionsRow } from '../tag-suggestions-row/tag-suggestions-row';

interface Props {
    readonly isSplitActive: boolean;
    readonly showTagSuggestions: boolean;
    readonly showCategorySuggestions: boolean;
    readonly showRepeatedSuggestions: boolean;
    readonly transactionType: TransactionTypeEnum;
    readonly accountId: number;
    readonly amount: number;
    readonly transactionTitle: string;
    readonly categoryId: number | null;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly onSelectTag: (tagId: number) => void;
    readonly onSelectCategory: (categoryId: number) => void;
    readonly onSelectRepeatedPattern: (pattern: RepeatedTransactionPatternInterface) => void;
}

export const SuggestionRowSwitcher = (props: Props) => {
    const {
        isSplitActive,
        showTagSuggestions,
        showCategorySuggestions,
        showRepeatedSuggestions,
        transactionType,
        accountId,
        amount,
        transactionTitle,
        categoryId,
        mccCategoryId,
        comment,
        aiContext,
        onSelectTag,
        onSelectCategory,
        onSelectRepeatedPattern
    } = props;

    if (isSplitActive) {
        return <SuggestionRowSpacer />;
    }

    if (showTagSuggestions) {
        return (
            <TagSuggestionsRow
                transactionTitle={transactionTitle}
                categoryId={categoryId ?? 0}
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
            <RepeatedTransactionSuggestionsRow
                enabled={showRepeatedSuggestions}
                type={transactionType}
                accountId={accountId}
                amount={amount}
                categoryId={categoryId ?? 0}
                onSelect={onSelectRepeatedPattern}
            />
        );
    }

    return (
        <CategorySuggestionsRow
            transactionTitle={transactionTitle}
            mccCategoryId={mccCategoryId}
            comment={comment}
            aiContext={aiContext}
            enabled={showCategorySuggestions}
            onSelect={onSelectCategory}
        />
    );
};
