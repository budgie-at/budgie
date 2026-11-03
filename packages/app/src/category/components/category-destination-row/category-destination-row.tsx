import { DestinationRow } from '../../../@generic/component/destination-row/destination-row';
import { useFormatEntityUsage } from '../../../@generic/hook/use-format-entity-usage.hook';
import { CategorySelectorModalSelector } from '../../../app/category-selector-modal.selector';
import { CategoryIconDisc } from '../category-icon-disc/category-icon-disc';

import type { EntityUsageInterface } from '../../../@generic/interface/entity-usage.interface';
import type { CategoryEntityInterface } from '@budgie/contracts';

interface Props {
    readonly category: CategoryEntityInterface;
    readonly usage: EntityUsageInterface | undefined;
    readonly isSelected: boolean;
    readonly isDisabled: boolean;
    readonly onSelect: (id: number) => void;
}

export const CategoryDestinationRow = ({ category, usage, isSelected, isDisabled, onSelect }: Props) => {
    const formatUsage = useFormatEntityUsage();

    return (
        <DestinationRow
            id={category.id}
            title={category.title}
            subtitle={formatUsage(usage)}
            left={<CategoryIconDisc category={category} />}
            isSelected={isSelected}
            isDisabled={isDisabled}
            onSelect={onSelect}
            testID={CategorySelectorModalSelector.Card(category.title)}
        />
    );
};
