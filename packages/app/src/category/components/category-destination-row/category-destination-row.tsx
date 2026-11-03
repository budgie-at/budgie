import { DestinationRow } from '../../../@generic/component/destination-row/destination-row';
import { CategorySelectorModalSelector } from '../../../app/category-selector-modal.selector';
import { CategoryIconDisc } from '../category-icon-disc/category-icon-disc';

import type { CategoryEntityInterface } from '@budgie/contracts';

interface Props {
    readonly category: CategoryEntityInterface;
    readonly subtitle: string | null;
    readonly isSelected: boolean;
    readonly isDisabled: boolean;
    readonly onSelect: (id: number) => void;
}

export const CategoryDestinationRow = ({ category, subtitle, isSelected, isDisabled, onSelect }: Props) => (
    <DestinationRow
        id={category.id}
        title={category.title}
        subtitle={subtitle}
        left={<CategoryIconDisc category={category} />}
        isSelected={isSelected}
        isDisabled={isDisabled}
        onSelect={onSelect}
        testID={CategorySelectorModalSelector.Card(category.title)}
    />
);
