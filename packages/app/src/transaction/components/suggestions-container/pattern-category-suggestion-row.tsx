import { SuggestionStatus } from '@budgie/ai';
import { RepeatedTransactionPatternInterface } from '@budgie/contracts';

import { deduplicatePatternCategories } from '../../utils/deduplicate-pattern-categories.util';
import { SuggestionPill } from '../suggestion-pill/suggestion-pill';
import { SuggestionPillContent } from '../suggestion-pill-content/suggestion-pill-content';
import { SuggestionRow } from '../suggestion-row/suggestion-row';

type PatternCategorySuggestion = Pick<
    RepeatedTransactionPatternInterface,
    'categoryId' | 'categoryTitle' | 'categoryIcon' | 'occurrenceCount'
>;

interface Props {
    readonly patterns: RepeatedTransactionPatternInterface[];
    readonly status: SuggestionStatus;
    readonly enabled: boolean;
    readonly onSelect: (categoryId: number) => void;
}

const ANIMATION_DURATION = 200;
const STAGGER_DELAY = 60;

export const PatternCategorySuggestionRow = (props: Props) => {
    const { patterns, status, enabled, onSelect } = props;

    const categories = deduplicatePatternCategories(patterns);

    const handleSelect = (category: PatternCategorySuggestion): void => {
        onSelect(category.categoryId);
    };

    /* jscpd:ignore-start */
    const renderPill = (category: PatternCategorySuggestion, index: number, onPillSelect: () => void) => (
        <SuggestionPill
            key={category.categoryId}
            index={index}
            animationDuration={ANIMATION_DURATION}
            staggerDelay={STAGGER_DELAY}
            onPress={onPillSelect}
        >
            <SuggestionPillContent icon={category.categoryIcon} title={category.categoryTitle} />
        </SuggestionPill>
    );

    return <SuggestionRow suggestions={categories} status={status} enabled={enabled} renderPill={renderPill} onSelect={handleSelect} />;
    /* jscpd:ignore-end */
};
