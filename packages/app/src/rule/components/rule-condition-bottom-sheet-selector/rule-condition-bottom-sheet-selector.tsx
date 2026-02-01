import { MessageDescriptor } from '@lingui/core';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { RuleSelectorSheet } from '../rule-selector-sheet/rule-selector-sheet';

interface Option<T extends string> {
    readonly value: T;
    readonly label: MessageDescriptor;
}

interface Props<T extends string> {
    readonly value: T;
    readonly onChange: (value: T) => void;
    readonly options: Option<T>[];
    readonly sheetTitle: string;
    readonly defaultLabel: string;
    readonly testID?: string;
}

export const RuleConditionBottomSheetSelector = <T extends string>({
    value,
    onChange,
    options,
    sheetTitle,
    defaultLabel,
    testID
}: Props<T>) => {
    const { t } = useLingui();
    const sheetRef = useRef<BottomSheetInterface | null>(null);

    const handleOpenSheet = () => void sheetRef.current?.open();
    const handleCloseSheet = () => void sheetRef.current?.close();

    const handleSelect = (newValue: T) => {
        onChange(newValue);
        handleCloseSheet();
    };

    const translatedOptions = options.map(option => ({ value: option.value, label: t(option.label) }));
    const displayLabel = translatedOptions.find(option => option.value === value)?.label ?? defaultLabel;

    return (
        <>
            <HapticPressable
                testID={testID}
                onPress={handleOpenSheet}
                className="bg-secondary-background rounded-xl px-lg py-md border border-secondary-corner"
            >
                <Text className="text-primary text-sm">{displayLabel}</Text>
            </HapticPressable>

            <RuleSelectorSheet
                ref={sheetRef}
                title={sheetTitle}
                options={translatedOptions}
                selectedValue={value}
                onSelect={handleSelect}
            />
        </>
    );
};
