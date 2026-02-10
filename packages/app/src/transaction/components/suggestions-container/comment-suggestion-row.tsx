import { UserIconNameEnum } from '@budgie/contracts';

import { useCommentSuggestion } from '../../../ai/hook/use-comment-suggestion.hook';
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
    readonly onSelect: (comment: string) => void;
}

const ANIMATION_DURATION = 200;
const STAGGER_DELAY = 60;

export const CommentSuggestionRow = (props: Props) => {
    const { transactionTitle, categoryId, mccCategoryId, comment, aiContext, enabled, onSelect } = props;

    const { suggestions, status } = useCommentSuggestion({
        transactionTitle,
        categoryId,
        mccCategoryId,
        comment,
        aiContext,
        enabled
    });

    const renderPill = (suggestedComment: string, index: number, onPillSelect: () => void) => (
        <SuggestionPill
            key={suggestedComment}
            index={index}
            animationDuration={ANIMATION_DURATION}
            staggerDelay={STAGGER_DELAY}
            onPress={onPillSelect}
        >
            <SuggestionPillContent icon={UserIconNameEnum.MessageSquare} title={suggestedComment} />
        </SuggestionPill>
    );

    return <SuggestionRow suggestions={suggestions} status={status} enabled={enabled} renderPill={renderPill} onSelect={onSelect} />;
};
