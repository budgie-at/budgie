import { TagEntityInterface } from '@budgie/contracts';

import { useTagSuggestion } from '../../../ai/hook/use-tag-suggestion.hook';
import { SuggestionPill } from '../suggestion-pill/suggestion-pill';
import { SuggestionRow } from '../suggestion-row/suggestion-row';

import { TagPillContent } from './tag-pill-content';

interface Props {
    readonly transactionTitle: string;
    readonly categoryId: number;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly enabled: boolean;
    readonly onSelect: (tagId: number) => void;
}

const ANIMATION_DURATION = 200;
const STAGGER_DELAY = 60;

export const TagSuggestionRow = (props: Props) => {
    const { transactionTitle, categoryId, mccCategoryId, comment, aiContext, enabled, onSelect } = props;

    const { suggestions, status } = useTagSuggestion({
        transactionTitle,
        categoryId,
        mccCategoryId,
        comment,
        aiContext,
        enabled
    });

    const handleSelect = (tag: TagEntityInterface): void => {
        onSelect(tag.id);
    };

    const renderPill = (tag: TagEntityInterface, index: number, onPillSelect: () => void) => (
        <SuggestionPill
            key={tag.id}
            index={index}
            animationDuration={ANIMATION_DURATION}
            staggerDelay={STAGGER_DELAY}
            onPress={onPillSelect}
        >
            <TagPillContent tag={tag} />
        </SuggestionPill>
    );

    return <SuggestionRow suggestions={suggestions} status={status} enabled={enabled} renderPill={renderPill} onSelect={handleSelect} />;
};
