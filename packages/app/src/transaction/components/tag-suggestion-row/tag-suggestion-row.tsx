import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';

import { useTagSuggestion } from '../../../ai/hook/use-tag-suggestion.hook';
import { CategoryScopedSuggestionRowPropsInterface } from '../../interface/category-scoped-suggestion-row-props.interface';
import { IconTitleSuggestionRow } from '../icon-title-suggestion-row/icon-title-suggestion-row';
import { IconTitleSuggestionRowSelector } from '../icon-title-suggestion-row/icon-title-suggestion-row.selector';

interface Props extends CategoryScopedSuggestionRowPropsInterface {
    readonly onSelect: (tagId: number) => void;
}

const getTagKey = (tag: TagEntityInterface): number => tag.id;
const getTagIcon = (): UserIconNameEnum => UserIconNameEnum.Hash;
const getTagTitle = (tag: TagEntityInterface): string => tag.title;

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

    return (
        <IconTitleSuggestionRow
            suggestions={suggestions}
            status={status}
            enabled={enabled}
            onSelect={handleSelect}
            getKey={getTagKey}
            getIcon={getTagIcon}
            getTitle={getTagTitle}
            testIDPrefix={IconTitleSuggestionRowSelector.Tag}
        />
    );
};
