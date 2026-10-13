import { UserIconNameEnum } from '@budgie/contracts';

import { useCommentSuggestion } from '../../../ai/hook/use-comment-suggestion.hook';
import { CategoryScopedSuggestionRowPropsInterface } from '../../interface/category-scoped-suggestion-row-props.interface';
import { IconTitleSuggestionRow } from '../icon-title-suggestion-row/icon-title-suggestion-row';
import { IconTitleSuggestionRowSelector } from '../icon-title-suggestion-row/icon-title-suggestion-row.selector';

interface Props extends CategoryScopedSuggestionRowPropsInterface {
    readonly onSelect: (comment: string) => void;
}

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
            items={suggestions.map(suggestedComment => ({
                key: suggestedComment,
                icon: UserIconNameEnum.MessageSquare,
                title: suggestedComment,
                onSelect: () => void onSelect(suggestedComment)
            }))}
            status={status}
            enabled={enabled}
            testIDPrefix={IconTitleSuggestionRowSelector.Comment}
        />
    );
};
