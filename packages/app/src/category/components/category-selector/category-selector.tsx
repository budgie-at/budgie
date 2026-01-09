import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useGetCategoryByIdQuery } from '../../query/use-get-category-by-id.query';
import { CategorySelectorBottomSheet } from '../category-selector-bottom-sheet/category-selector-bottom-sheet';

interface Props {
    readonly categoryId: number | null;
    readonly variant: ColorPaletteVariant;
    readonly onSelect: (categoryId: number | null) => void;
    readonly cardVariant?: ColorPaletteVariant;
}

export const CategorySelector = ({ variant, categoryId, onSelect, cardVariant = 'primary' }: Props) => {
    const { t } = useLingui();

    const bottomSheetRef = useRef<BottomSheetInterface | null>(null);

    const { category: selectedCategory } = useGetCategoryByIdQuery(categoryId ?? 0);

    const handleOpen = () => bottomSheetRef.current?.open();

    return (
        <>
            <SimpleHorizontalCell
                variant={cardVariant}
                title={selectedCategory?.title ?? t`Select category`}
                left={<CircleIcon icon={selectedCategory?.icon ?? UserIconNameEnum.Home} variant={variant} />}
                onPress={handleOpen}
            />

            <CategorySelectorBottomSheet variant={variant} selectedCategory={selectedCategory} onSelect={onSelect} ref={bottomSheetRef} />
        </>
    );
};
