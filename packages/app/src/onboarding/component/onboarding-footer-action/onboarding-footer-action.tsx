import { Text } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly label: string;
    readonly testID: string;
    readonly onPress: EmptyFn;
    readonly isDisabled?: boolean;
}

export const OnboardingFooterAction = ({ label, testID, onPress, isDisabled = false }: Props) => {
    const isKeyboardVisible = useKeyboardState(state => state.isVisible);
    const accessibilityState = { disabled: isDisabled };

    if (isKeyboardVisible) {
        return null;
    }

    return (
        <HapticPressable
            testID={testID}
            onPress={onPress}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={accessibilityState}
            className={cn('min-h-[44px] items-center justify-center active:opacity-60', isDisabled && 'opacity-40')}
        >
            <Text className="text-primary text-center text-[17px] font-medium">{label}</Text>
        </HapticPressable>
    );
};
