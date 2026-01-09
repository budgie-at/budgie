import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';

import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FormFieldStatus } from '../../../@generic/type/form-field-status.type';
import { useGetCategoryByIdQuery } from '../../query/use-get-category-by-id.query';
import { CategorySelectorBottomSheet } from '../category-selector-bottom-sheet/category-selector-bottom-sheet';

interface Props {
    readonly categoryId: number | null;
    readonly variant: ColorPaletteVariant;
    readonly onSelect: (categoryId: number | null) => void;
    readonly status?: FormFieldStatus;
}

export const CategorySelector = ({ variant, categoryId, onSelect, status = 'default' }: Props) => {
    const { t } = useLingui();

    const bottomSheetRef = useRef<BottomSheetInterface | null>(null);

    const { category: selectedCategory } = useGetCategoryByIdQuery(categoryId ?? 0);

    const handleOpen = () => bottomSheetRef.current?.open();

    const icon = selectedCategory?.icon ?? UserIconNameEnum.Home;
    const cardVariant = status === 'error' ? 'destructive' : 'primary';
    const iconParams = { variant, size: 38, iconSize: 18 };

    return (
        <>
            <SimpleHorizontalCell
                variant={cardVariant}
                title={selectedCategory?.title ?? t`Select category`}
                icon={icon}
                onPress={handleOpen}
                iconParams={iconParams}
            />

            <CategorySelectorBottomSheet variant={variant} selectedCategory={selectedCategory} onSelect={onSelect} ref={bottomSheetRef} />
        </>
    );
};
