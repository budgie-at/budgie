import { useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';

import { EntitySelector } from '../../../@generic/components/entity-selector/entity-selector';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useGetCategoryByIdQuery } from '../../query/use-get-category-by-id.query';
import { CategorySelectorBottomSheet } from '../category-selector-bottom-sheet/category-selector-bottom-sheet';

interface Props {
    readonly categoryId: number | null;
    readonly variant: ColorPaletteVariant;
    readonly onSelect: (categoryId: number) => void;
}

export const CategorySelector = ({ variant, categoryId, onSelect }: Props) => {
    const { category: selectedCategory } = useGetCategoryByIdQuery(categoryId ?? 0);
    const { t } = useLingui();

    const icon = selectedCategory?.icon ?? 'Home';

    const renderBottomSheet = (ref: RefObject<BottomSheetInterface | null>) => (
        <CategorySelectorBottomSheet variant={variant} selectedCategory={selectedCategory} onSelect={onSelect} ref={ref} />
    );

    return (
        <EntitySelector
            variant={variant}
            icon={icon}
            emptyStateText={t`Select category`}
            title={selectedCategory?.title}
            renderBottomSheet={renderBottomSheet}
        />
    );
};
