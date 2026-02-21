import { UserIconNameEnum } from '@budgie/contracts';

import { useCommentSuggestion } from '../../../ai/hook/use-comment-suggestion.hook';
import { IconTitleSuggestionRow } from '../icon-title-suggestion-row/icon-title-suggestion-row';

interface Props {
    readonly transactionTitle: string;
    readonly categoryId: number;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly enabled: boolean;
    readonly onSelect: (comment: string) => void;
}

const getCommentKey = (suggestedComment: string): string => suggestedComment;
const getCommentIcon = (): UserIconNameEnum => UserIconNameEnum.MessageSquare;
const getCommentTitle = (suggestedComment: string): string => suggestedComment;

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

    return (
        <IconTitleSuggestionRow
            suggestions={suggestions}
            status={status}
            enabled={enabled}
            onSelect={onSelect}
            getKey={getCommentKey}
            getIcon={getCommentIcon}
            getTitle={getCommentTitle}
        />
    );
};
