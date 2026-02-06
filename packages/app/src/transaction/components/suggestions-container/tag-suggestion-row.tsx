import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';

import { useTagSuggestion } from '../../../ai/hook/use-tag-suggestion.hook';
import { SuggestionPill } from '../suggestion-pill/suggestion-pill';
import { SuggestionPillContent } from '../suggestion-pill-content/suggestion-pill-content';
import { SuggestionRow } from '../suggestion-row/suggestion-row';

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

    const { suggestions, status, source } = useTagSuggestion({
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
            <SuggestionPillContent icon={UserIconNameEnum.Hash} title={tag.title} badge={source ?? ''} />
        </SuggestionPill>
    );

    return <SuggestionRow suggestions={suggestions} status={status} enabled={enabled} renderPill={renderPill} onSelect={handleSelect} />;
};
