import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useRepeatedTransactionSuggestion } from '../../hook/use-repeated-transaction-suggestion.hook';
import { useSuggestionLoadingState } from '../../hook/use-suggestion-loading-state.hook';
import { RepeatedTransactionSuggestionPillItem } from '../repeated-transaction-suggestion-pill-item/repeated-transaction-suggestion-pill-item';
import { SuggestionRowLayout } from '../suggestion-row-layout/suggestion-row-layout';

interface Props {
    readonly enabled: boolean;
    readonly type: TransactionTypeEnum;
    readonly accountId: number;
    readonly amount: number;
    readonly categoryId: number;
    readonly onSelect: (pattern: RepeatedTransactionPatternInterface) => void;
}

const ANIMATION_DURATION = 200;
const STAGGER_DELAY = 60;

export const RepeatedTransactionSuggestionsRow = (props: Props) => {
    const { enabled, type, accountId, amount, categoryId, onSelect } = props;

    const { status, suggestions } = useRepeatedTransactionSuggestion({
        enabled,
        type,
        accountId,
        amount,
        categoryId
    });

    const { showLoading, showContent, markSelected } = useSuggestionLoadingState({
        status,
        hasResults: isNotEmptyArray(suggestions),
        enabled
    });

    const handleSelect = (pattern: RepeatedTransactionPatternInterface): void => {
        markSelected();
        onSelect(pattern);
    };

    return (
        <SuggestionRowLayout showContent={showContent} showLoading={showLoading}>
            {suggestions.map((pattern, index) => (
                <RepeatedTransactionSuggestionPillItem
                    key={`${pattern.categoryId}-${pattern.title}`}
                    pattern={pattern}
                    index={index}
                    animationDuration={ANIMATION_DURATION}
                    staggerDelay={STAGGER_DELAY}
                    onSelect={handleSelect}
                />
            ))}
        </SuggestionRowLayout>
    );
};
