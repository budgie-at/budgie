import { CategoryEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FilterRow } from '../../../@generic/component/filter-sheet/filter-row/filter-row';
import { FilterRowCheck } from '../../../@generic/component/filter-sheet/filter-row-check/filter-row-check';
import { FilterRowTitle } from '../../../@generic/component/filter-sheet/filter-row-title/filter-row-title';
import { resolveCategoryTitle } from '../../../category/utils/resolve-category-title.util';
import { TransactionFiltersSelector } from '../transaction-filters/transaction-filters.selector';

interface Props {
    readonly isSelected: boolean;
    readonly onSelect: (value: number) => void;
    readonly category: CategoryEntityInterface;
}

export const TransactionCategoryFilterItem = ({ onSelect, category, isSelected }: Props) => {
    const { i18n } = useLingui();

    const handleSelect = () => void onSelect(category.id);
    const visibleTitle = resolveCategoryTitle(category, i18n) ?? category.title;

    return (
        <FilterRow isSelected={isSelected} onPress={handleSelect} testID={TransactionFiltersSelector.CategoryOption(category.title)}>
            <CircleIcon icon={category.icon} variant="ghost" size={32} iconSize={16} />
            <FilterRowTitle>{visibleTitle}</FilterRowTitle>
            <FilterRowCheck isSelected={isSelected} testID={TransactionFiltersSelector.CategoryOptionSelected(category.title)} />
        </FilterRow>
    );
};
