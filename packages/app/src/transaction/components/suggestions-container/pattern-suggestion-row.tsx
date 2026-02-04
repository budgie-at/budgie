import { RepeatedTransactionPatternInterface, TransactionTypeEnum } from '@budgie/contracts';

import { useRepeatedTransactionSuggestion } from '../../hook/use-repeated-transaction-suggestion.hook';
import { SuggestionPill } from '../suggestion-pill/suggestion-pill';
import { SuggestionPillContent } from '../suggestion-pill-content/suggestion-pill-content';
import { SuggestionRow } from '../suggestion-row/suggestion-row';

interface Props {
    readonly transactionType: TransactionTypeEnum;
    readonly accountId: number;
    readonly amount: number;
    readonly categoryId: number;
    readonly enabled: boolean;
    readonly onSelect: (pattern: RepeatedTransactionPatternInterface) => void;
}

const ANIMATION_DURATION = 200;
const STAGGER_DELAY = 60;

export const PatternSuggestionRow = (props: Props) => {
    const { transactionType, accountId, amount, categoryId, enabled, onSelect } = props;

    const { suggestions, status } = useRepeatedTransactionSuggestion({
        enabled,
        type: transactionType,
        accountId,
        amount,
        categoryId
    });

    const renderPill = (pattern: RepeatedTransactionPatternInterface, index: number, onPillSelect: () => void) => (
        <SuggestionPill
            key={`${pattern.categoryId}-${pattern.title}`}
            index={index}
            animationDuration={ANIMATION_DURATION}
            staggerDelay={STAGGER_DELAY}
            maxWidth="max-w-48"
            onPress={onPillSelect}
        >
            <SuggestionPillContent icon={pattern.categoryIcon} title={pattern.title} badge={pattern.categoryTitle} />
        </SuggestionPill>
    );

    return <SuggestionRow suggestions={suggestions} status={status} enabled={enabled} renderPill={renderPill} onSelect={onSelect} />;
};
