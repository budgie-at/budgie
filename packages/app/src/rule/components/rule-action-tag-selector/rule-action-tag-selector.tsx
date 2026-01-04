import { RuleCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
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
import { useSearchTagsQuery } from '../../../tag/query/use-search-tags.query';

interface Props {
    index: number;
}

export const RuleActionTagSelector = ({ index }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const sheetRef = useRef<BottomSheetInterface | null>(null);

    const tagId = useWatch({ control, name: `actions.${index}.tagId` });
    const { tags } = useSearchTagsQuery('');
    const selectedTag = tags?.find(tag => tag.id === tagId);

    const handleOpen = () => void sheetRef.current?.open();
    const handleClose = () => void sheetRef.current?.close();

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, `actions.${number}.tagId`>) => {
        const handleSelect = (newValue: number) => {
            onChange(newValue);
            handleClose();
        };

        return (
            <>
                <HapticPressable onPress={handleOpen} className="bg-secondary-background rounded-xl px-lg py-md border border-secondary-corner">
                    <Text className="text-primary text-sm">{selectedTag?.title ?? t`Select Tag`}</Text>
                </HapticPressable>
                <BottomSheet enableDynamicSizing ref={sheetRef}>
                    <BottomSheetScrollView>
                        <View className="p-5xl gap-y-lg">
                            <Text className="text-primary text-lg font-semibold mb-lg"><Trans>Select Tag</Trans></Text>
                            {tags?.map(tag => (
                                <SelectorCard
                                    key={tag.id}
                                    identifier={tag.id}
                                    isSelected={tag.id === value}
                                    onSelect={handleSelect}
                                    iconSlot={
                                        <View className="w-10 h-10 bg-secondary-background rounded-full items-center justify-center">
                                            <Icon icon={UserIconNameEnum.Tag} className="text-primary" size={18} />
                                        </View>
                                    }
                                    title={tag.title}
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
            <Text className="text-secondary-foreground text-xs mb-xs"><Trans>Tag</Trans></Text>
            <Controller control={control} name={`actions.${index}.tagId`} render={renderSelector} />
        </View>
    );
};
