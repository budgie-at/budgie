import React from 'react';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { PinFormSelector } from '../pin-form/pin-form.selector';

interface Props {
    readonly digit: string;
    readonly disabled?: boolean;
    readonly onPress: (digit: string) => void;
}

export const PinFormButton = ({ digit, onPress, disabled }: Props) => {
    const handlePress = () => void onPress(digit);

    return (
        <HapticPressable
            onPress={handlePress}
            disabled={disabled}
            testID={PinFormSelector.Digit(digit)}
            className="flex-1 max-w-23 justify-center items-center rounded-3xl bg-secondary-background border border-secondary-corner aspect-square"
        >
            <Text className="text-xl text-primary">{digit}</Text>
        </HapticPressable>
    );
};
