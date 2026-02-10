import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';

/* jscpd:ignore-start */
import { useTagSuggestion } from '../../../ai/hook/use-tag-suggestion.hook';
import { IconTitleSuggestionRow } from '../icon-title-suggestion-row/icon-title-suggestion-row';

interface Props {
    readonly transactionTitle: string;
    readonly categoryId: number;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly enabled: boolean;
    readonly onSelect: (tagId: number) => void;
}
/* jscpd:ignore-end */

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
        />
    );
};
