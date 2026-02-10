import { SuggestionStatus } from '@budgie/ai';
import { RepeatedTransactionPatternInterface, TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { getPatternTagIds } from '../../utils/get-pattern-tag-ids.util';
import { SuggestionPill } from '../suggestion-pill/suggestion-pill';
import { SuggestionPillContent } from '../suggestion-pill-content/suggestion-pill-content';
import { SuggestionRow } from '../suggestion-row/suggestion-row';

interface Props {
    readonly patterns: RepeatedTransactionPatternInterface[];
    readonly categoryId: number;
    readonly status: SuggestionStatus;
    readonly enabled: boolean;
    readonly onSelect: (tagId: number) => void;
}

const ANIMATION_DURATION = 200;
const STAGGER_DELAY = 60;

export const PatternTagSuggestionRow = (props: Props) => {
    const { patterns, categoryId, status, enabled, onSelect } = props;

    const tagIds = getPatternTagIds(patterns, categoryId);
    const { tags } = useGetTagByIdsQuery(tagIds);

    const resolvedTags = tags ?? [];
    const effectiveStatus: SuggestionStatus = isNotEmptyArray(resolvedTags) ? status : 'loading';

    const handleSelect = (tag: TagEntityInterface): void => {
        onSelect(tag.id);
    };

    /* jscpd:ignore-start */
    const renderPill = (tag: TagEntityInterface, index: number, onPillSelect: () => void) => (
        <SuggestionPill
            key={tag.id}
            index={index}
            animationDuration={ANIMATION_DURATION}
            staggerDelay={STAGGER_DELAY}
            onPress={onPillSelect}
        >
            <SuggestionPillContent icon={UserIconNameEnum.Hash} title={tag.title} />
        </SuggestionPill>
    );

    return (
        <SuggestionRow
            suggestions={resolvedTags}
            status={effectiveStatus}
            enabled={enabled}
            renderPill={renderPill}
            onSelect={handleSelect}
        />
    );
    /* jscpd:ignore-end */
};
