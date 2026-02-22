import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';

import { useCategorySuggestionRow } from '../../hooks/use-category-suggestion-row.hook';
import { IconTitleSuggestionRow } from '../icon-title-suggestion-row/icon-title-suggestion-row';

interface Props {
    readonly transactionTitle: string;
    readonly mccCategoryId: number | null;
    readonly comment: string;
    readonly aiContext: string;
    readonly enabled: boolean;
    readonly onSelect: (categoryId: number) => void;
}

const getCategoryKey = (category: CategoryEntityInterface): number => category.id;
const getCategoryIcon = (category: CategoryEntityInterface): UserIconNameEnum => category.icon;
const getCategoryTitle = (category: CategoryEntityInterface): string => category.title;

export const CategorySuggestionRow = (props: Props) => {
    const { suggestions, status, handleSelect } = useCategorySuggestionRow(props);

    return (
        <IconTitleSuggestionRow
            suggestions={suggestions}
            status={status}
            enabled={props.enabled}
            onSelect={handleSelect}
            getKey={getCategoryKey}
            getIcon={getCategoryIcon}
            getTitle={getCategoryTitle}
        />
    );
};
