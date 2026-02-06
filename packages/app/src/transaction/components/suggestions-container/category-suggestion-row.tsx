import { CategoryEntityInterface } from '@budgie/contracts';

import { useCategorySuggestion } from '../../../ai/hook/use-category-suggestion.hook';
import { SuggestionPill } from '../suggestion-pill/suggestion-pill';
import { SuggestionPillContent } from '../suggestion-pill-content/suggestion-pill-content';
import { SuggestionRow } from '../suggestion-row/suggestion-row';

interface Props {
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly enabled: boolean;
    readonly onSelect: (categoryId: number) => void;
}

const ANIMATION_DURATION = 200;
const STAGGER_DELAY = 60;

export const CategorySuggestionRow = (props: Props) => {
    const { transactionTitle, mccCategoryId, comment, aiContext, enabled, onSelect } = props;

    const { suggestions, status, source } = useCategorySuggestion({
        transactionTitle,
        mccCategoryId,
        comment,
        aiContext,
        enabled
    });

    const handleSelect = (category: CategoryEntityInterface): void => {
        onSelect(category.id);
    };

    /* jscpd:ignore-start */
    const renderPill = (category: CategoryEntityInterface, index: number, onPillSelect: () => void) => (
        <SuggestionPill
            key={category.id}
            index={index}
            animationDuration={ANIMATION_DURATION}
            staggerDelay={STAGGER_DELAY}
            onPress={onPillSelect}
        >
            <SuggestionPillContent icon={category.icon} title={category.title} badge={source ?? ''} />
        </SuggestionPill>
    );

    return <SuggestionRow suggestions={suggestions} status={status} enabled={enabled} renderPill={renderPill} onSelect={handleSelect} />;
    /* jscpd:ignore-end */
};
