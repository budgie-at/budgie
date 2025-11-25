import { Trans } from '@lingui/react/macro';
import { useRef } from 'react';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/components/card/card';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useGetCategoryByIdQuery } from '../../query/use-get-category-by-id.query';
import { CategorySelectorBottomSheet } from '../category-selector-bottom-sheet/category-selector-bottom-sheet';

interface Props {
    readonly categoryId: number | null;
    readonly variant: ColorPaletteVariant;
    readonly onSelect: (categoryId: number) => void;
}

export const TransactionEntryCategorySelector = ({ variant, categoryId, onSelect }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { category: selectedCategory } = useGetCategoryByIdQuery(categoryId ?? 0);

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <Card
                onPress={handleOpen}
                className="p-lg rounded-5xl border border-secondary-corner h-full w-[110px] flex-row items-center gap-x-sm"
            >
                {isDefined(selectedCategory) ? <Icon icon={ICONS[selectedCategory.icon]} size={14} className="text-primary" /> : null}

                <Text className="text-primary text-xs flex-1" numberOfLines={1} ellipsizeMode="tail">
                    {isDefined(selectedCategory) ? selectedCategory.title : <Trans>Category</Trans>}
                </Text>
            </Card>

            <CategorySelectorBottomSheet variant={variant} selectedCategory={selectedCategory} onSelect={onSelect} ref={ref} />
        </>
    );
};
