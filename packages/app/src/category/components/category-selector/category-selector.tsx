import { Trans } from '@lingui/react/macro';
import { useRef } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
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

export const CategorySelector = ({ variant, categoryId, onSelect }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);

    const { category: selectedCategory } = useGetCategoryByIdQuery(categoryId ?? 0);

    const handleOpen = () => ref.current?.open();

    const icon = selectedCategory?.icon ?? 'Home';

    return (
        <>
            <Card onPress={handleOpen} className="flex-row items-center gap-x-xl">
                <CircleIcon size="lg" icon={ICONS[icon]} variant={variant} />

                {isDefined(selectedCategory) ? (
                    <View className="mr-auto">
                        <Text className="text-sm text-primary font-semibold">{selectedCategory.title}</Text>
                    </View>
                ) : (
                    <Text className="flex-1 text-center font-semibold text-primary text-sm">
                        <Trans>Select category</Trans>
                    </Text>
                )}

                <CircleIcon icon={ICONS.ChevronRight} className="bg-transparent border-0" variant="ghost" />
            </Card>

            <CategorySelectorBottomSheet variant={variant} selectedCategory={selectedCategory} onSelect={onSelect} ref={ref} />
        </>
    );
};
