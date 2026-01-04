import { useRef } from 'react';
import { Text, View } from 'react-native';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetScrollView } from '../../../@generic/component/bottom-sheet-scroll-view/bottom-sheet-scroll-view';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { SelectorCard } from '../../../@generic/component/selector-card/selector-card';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';

interface Option<T extends string> {
    value: T;
    label: string;
}

interface Props<T extends string> {
    value: T;
    onChange: (value: T) => void;
    options: Option<T>[];
    sheetTitle: string;
    getLabel: (value: T) => string;
}

const iconSlot = <View className="w-10 h-10 bg-secondary-background rounded-full items-center justify-center" />;

export const RuleConditionBottomSheetSelector = <T extends string>({ value, onChange, options, sheetTitle, getLabel }: Props<T>) => {
    const sheetRef = useRef<BottomSheetInterface | null>(null);

    const handleOpenSheet = () => void sheetRef.current?.open();
    const handleCloseSheet = () => void sheetRef.current?.close();

    const handleSelect = (newValue: T) => {
        onChange(newValue);
        handleCloseSheet();
    };

    return (
        <>
            <HapticPressable
                onPress={handleOpenSheet}
                className="bg-secondary-background rounded-xl px-lg py-md border border-secondary-corner"
            >
                <Text className="text-primary text-sm">{getLabel(value)}</Text>
            </HapticPressable>
            <BottomSheet enableDynamicSizing ref={sheetRef}>
                <BottomSheetScrollView>
                    <View className="p-5xl gap-y-lg">
                        <Text className="text-primary text-lg font-semibold mb-lg">{sheetTitle}</Text>
                        {options.map(option => (
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
