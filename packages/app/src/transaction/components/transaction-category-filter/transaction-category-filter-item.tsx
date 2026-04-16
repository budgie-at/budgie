import { CategoryEntityInterface } from '@budgie/contracts';

import { TransactionFiltersSelectors } from '../../../@e2e/selectors/transaction-filters.selector';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FilterRow } from '../../../@generic/component/filter-sheet/filter-row/filter-row';
import { FilterRowCheck } from '../../../@generic/component/filter-sheet/filter-row-check/filter-row-check';
import { FilterRowTitle } from '../../../@generic/component/filter-sheet/filter-row-title/filter-row-title';

interface Props {
    readonly isSelected: boolean;
    readonly onSelect: (value: number) => void;
    readonly category: CategoryEntityInterface;
}

export const TransactionCategoryFilterItem = ({ onSelect, category, isSelected }: Props) => {
    const handleSelect = () => void onSelect(category.id);

    return (
        <FilterRow isSelected={isSelected} onPress={handleSelect} testID={TransactionFiltersSelectors.CategoryOption(category.title)}>
            <CircleIcon icon={category.icon} variant="ghost" size={32} iconSize={16} />
            <FilterRowTitle>{category.title}</FilterRowTitle>
            <FilterRowCheck isSelected={isSelected} testID={TransactionFiltersSelectors.CategoryOptionSelected(category.title)} />
        </FilterRow>
    );
};
