import { useRef } from 'react';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { RuleSelectorSheet } from '../rule-selector-sheet/rule-selector-sheet';

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

    const optionsWithIcon = options.map(option => ({ ...option, iconSlot }));

    return (
        <>
            <HapticPressable
                onPress={handleOpenSheet}
                className="bg-secondary-background rounded-xl px-lg py-md border border-secondary-corner"
            >
                <Text className="text-primary text-sm">{getLabel(value)}</Text>
            </HapticPressable>
            <RuleSelectorSheet ref={sheetRef} title={sheetTitle} options={optionsWithIcon} selectedValue={value} onSelect={handleSelect} />
        </>
    );
};
