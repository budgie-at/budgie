import { RuleActionTypeEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { Controller, UseControllerReturn, useFormContext } from 'react-hook-form';
import { Text, View } from 'react-native';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetScrollView } from '../../../@generic/component/bottom-sheet-scroll-view/bottom-sheet-scroll-view';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { SelectorCard } from '../../../@generic/component/selector-card/selector-card';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';

interface Props {
    index: number;
}

const ACTION_TYPE_OPTIONS: { value: RuleActionTypeEnum; label: MessageDescriptor }[] = [
    { value: RuleActionTypeEnum.SET_CATEGORY, label: msg`Set Category` },
    { value: RuleActionTypeEnum.ADD_TAG, label: msg`Add Tag` }
];

const iconSlot = <View className="w-10 h-10 bg-secondary-background rounded-full items-center justify-center" />;

export const RuleActionTypeSelector = ({ index }: Props) => {
    const { t, i18n } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const sheetRef = useRef<BottomSheetInterface | null>(null);

    const translatedOptions = ACTION_TYPE_OPTIONS.map(option => ({ value: option.value, label: i18n.t(option.label) }));
    const getLabel = (actionValue: RuleActionTypeEnum) =>
        translatedOptions.find(option => option.value === actionValue)?.label ?? t`Select Type`;

    const handleOpen = () => void sheetRef.current?.open();
    const handleClose = () => void sheetRef.current?.close();

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, `actions.${number}.type`>) => {
        const handleSelect = (newValue: RuleActionTypeEnum) => {
            onChange(newValue);
            handleClose();
        };

        return (
            <>
                <HapticPressable
                    onPress={handleOpen}
                    className="bg-secondary-background rounded-xl px-lg py-md border border-secondary-corner"
                >
                    <Text className="text-primary text-sm">{getLabel(value)}</Text>
                </HapticPressable>
                <BottomSheet enableDynamicSizing ref={sheetRef}>
                    <BottomSheetScrollView>
                        <View className="p-5xl gap-y-lg">
                            <Text className="text-primary text-lg font-semibold mb-lg">
                                <Trans>Select Action Type</Trans>
                            </Text>
                            {translatedOptions.map(option => (
                                <SelectorCard
                                    key={option.value}
                                    identifier={option.value}
                                    isSelected={option.value === value}
                                    onSelect={handleSelect}
                                    iconSlot={iconSlot}
                                    title={option.label}
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
            <Text className="text-secondary-foreground text-xs mb-xs">
                <Trans>Action Type</Trans>
            </Text>
            <Controller control={control} name={`actions.${index}.type`} render={renderSelector} />
        </View>
    );
};
