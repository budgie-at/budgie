import { SuggestionStatus } from '@budgie/ai';
import { RepeatedTransactionPatternInterface, UserIconNameEnum } from '@budgie/contracts';

import { getPatternComments } from '../../utils/get-pattern-comments.util';
import { SuggestionPill } from '../suggestion-pill/suggestion-pill';
import { SuggestionPillContent } from '../suggestion-pill-content/suggestion-pill-content';
import { SuggestionRow } from '../suggestion-row/suggestion-row';

/* jscpd:ignore-start */
interface Props {
    readonly patterns: RepeatedTransactionPatternInterface[];
    readonly categoryId: number;
    readonly status: SuggestionStatus;
    readonly enabled: boolean;
    readonly onSelect: (comment: string) => void;
}

const ANIMATION_DURATION = 200;
const STAGGER_DELAY = 60;

export const PatternCommentSuggestionRow = (props: Props) => {
    const { patterns, categoryId, status, enabled, onSelect } = props;

    const comments = getPatternComments(patterns, categoryId);

    const renderPill = (comment: string, index: number, onPillSelect: () => void) => (
        <SuggestionPill
            key={comment}
            index={index}
            animationDuration={ANIMATION_DURATION}
            staggerDelay={STAGGER_DELAY}
            onPress={onPillSelect}
        >
            <SuggestionPillContent icon={UserIconNameEnum.MessageSquare} title={comment} />
        </SuggestionPill>
    );

    return <SuggestionRow suggestions={comments} status={status} enabled={enabled} renderPill={renderPill} onSelect={onSelect} />;
};
/* jscpd:ignore-end */
