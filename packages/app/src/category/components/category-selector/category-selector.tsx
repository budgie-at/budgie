import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useCategorySelectorModal } from '../../context/category-selector-modal.context';
import { useGetCategoryByIdQuery } from '../../query/use-get-category-by-id.query';

interface Props {
    readonly categoryId: number | null;
    readonly variant: ColorPaletteVariant;
    readonly onSelect: (categoryId: number | null) => void;
    readonly cardVariant?: ColorPaletteVariant;
}

export const CategorySelector = ({ variant, categoryId, onSelect, cardVariant = 'primary' }: Props) => {
    const { t } = useLingui();
    const { openCategorySelector } = useCategorySelectorModal();

    const { category: selectedCategory } = useGetCategoryByIdQuery(categoryId ?? 0);

    const handleOpen = async () => {
        const selectedCategoryId = await openCategorySelector({ initialCategoryId: categoryId, variant });
        onSelect(selectedCategoryId);
    };

    return (
        <SimpleHorizontalCell
            variant={cardVariant}
            title={selectedCategory?.title ?? t`Select category`}
            left={<CircleIcon icon={selectedCategory?.icon ?? UserIconNameEnum.Home} variant={variant} />}
            onPress={handleOpen}
        />
    );
};
