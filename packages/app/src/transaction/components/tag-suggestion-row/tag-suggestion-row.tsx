import { UserIconNameEnum } from '@budgie/contracts';

import { useTagSuggestion } from '../../../ai/hook/use-tag-suggestion.hook';
import { CategoryScopedSuggestionRowPropsInterface } from '../../interface/category-scoped-suggestion-row-props.interface';
import { IconTitleSuggestionRow } from '../icon-title-suggestion-row/icon-title-suggestion-row';
import { IconTitleSuggestionRowSelector } from '../icon-title-suggestion-row/icon-title-suggestion-row.selector';

interface Props extends CategoryScopedSuggestionRowPropsInterface {
    readonly onSelect: (tagId: number) => void;
}

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

    return (
        <IconTitleSuggestionRow
            items={suggestions.map(tag => ({
                key: tag.id,
                icon: UserIconNameEnum.Hash,
                title: tag.title,
                onSelect: () => void onSelect(tag.id)
            }))}
            status={status}
            enabled={enabled}
            testIDPrefix={IconTitleSuggestionRowSelector.Tag}
        />
    );
};
