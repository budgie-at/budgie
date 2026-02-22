import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';

import { useTagSuggestionRow } from '../../hooks/use-tag-suggestion-row.hook';
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

const getTagKey = (tag: TagEntityInterface): number => tag.id;
const getTagIcon = (): UserIconNameEnum => UserIconNameEnum.Hash;
const getTagTitle = (tag: TagEntityInterface): string => tag.title;

export const TagSuggestionRow = (props: Props) => {
    const { suggestions, status, handleSelect } = useTagSuggestionRow(props);

    return (
        <IconTitleSuggestionRow
            suggestions={suggestions}
            status={status}
            enabled={props.enabled}
            onSelect={handleSelect}
            getKey={getTagKey}
            getIcon={getTagIcon}
            getTitle={getTagTitle}
        />
    );
};
