import { RuleCreateInputInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetScrollView } from '../../../@generic/component/bottom-sheet-scroll-view/bottom-sheet-scroll-view';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { SelectorCard } from '../../../@generic/component/selector-card/selector-card';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useSearchCategoriesQuery } from '../../../category/query/use-search-categories.query';

interface Props {
    index: number;
}

export const RuleActionCategorySelector = ({ index }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const sheetRef = useRef<BottomSheetInterface | null>(null);

    const categoryId = useWatch({ control, name: `actions.${index}.categoryId` });
    const { categories } = useSearchCategoriesQuery('', false);
    const selectedCategory = categories?.find(category => category.id === categoryId);

    const handleOpen = () => void sheetRef.current?.open();
    const handleClose = () => void sheetRef.current?.close();

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, `actions.${number}.categoryId`>) => {
        const handleSelect = (newValue: number) => {
            onChange(newValue);
            handleClose();
        };

        return (
            <>
                <HapticPressable onPress={handleOpen} className="bg-secondary-background rounded-xl px-lg py-md border border-secondary-corner">
                    <Text className="text-primary text-sm">{selectedCategory?.title ?? t`Select Category`}</Text>
                </HapticPressable>
                <BottomSheet enableDynamicSizing ref={sheetRef}>
                    <BottomSheetScrollView>
                        <View className="p-5xl gap-y-lg">
                            <Text className="text-primary text-lg font-semibold mb-lg"><Trans>Select Category</Trans></Text>
                            {categories?.map(category => (
                                <SelectorCard
                                    key={category.id}
                                    identifier={category.id}
                                    isSelected={category.id === value}
                                    onSelect={handleSelect}
                                    iconSlot={
                                        <View className="w-10 h-10 bg-secondary-background rounded-full items-center justify-center">
                                            <Icon icon={category.icon} className="text-primary" size={18} />
                                        </View>
                                    }
                                    title={category.title}
                                />
                            ))}
                        </View>
                    </BottomSheetScrollView>
                </BottomSheet>
            </>
        );
    };

    return (
        <View>
            <Text className="text-secondary-foreground text-xs mb-xs"><Trans>Category</Trans></Text>
            <Controller control={control} name={`actions.${index}.categoryId`} render={renderSelector} />
        </View>
    );
};
