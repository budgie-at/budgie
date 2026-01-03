import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';

import { EntitySelector } from '../../../@generic/component/entity-selector/entity-selector';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FormFieldStatus } from '../../../@generic/type/form-field-status.type';
import { useGetCategoryByIdQuery } from '../../query/use-get-category-by-id.query';
import { CategorySelectorBottomSheet } from '../category-selector-bottom-sheet/category-selector-bottom-sheet';

interface Props {
    readonly categoryId: number | null;
    readonly variant: ColorPaletteVariant;
    readonly onSelect: (categoryId: number) => void;
    readonly status?: FormFieldStatus;
}

export const CategorySelector = ({ variant, categoryId, onSelect, status }: Props) => {
    const { t } = useLingui();
    const ref = useRef<BottomSheetInterface | null>(null);
    const { category: selectedCategory } = useGetCategoryByIdQuery(categoryId ?? 0);

    const icon = selectedCategory?.icon ?? UserIconNameEnum.Home;

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <EntitySelector
                variant={variant}
                icon={icon}
                status={status}
                title={selectedCategory?.title ?? t`Select category`}
                onPress={handleOpen}
            />

            <CategorySelectorBottomSheet variant={variant} selectedCategory={selectedCategory ?? null} onSelect={onSelect} ref={ref} />
        </>
    );
};
