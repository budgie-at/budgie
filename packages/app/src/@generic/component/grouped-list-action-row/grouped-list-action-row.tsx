import { Text } from 'react-native';

import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly label: string;
    readonly onPress: () => void;
    readonly isDisabled: boolean;
    readonly labelClassName: string;
    readonly testID?: string;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const GroupedListActionRow = ({ label, onPress, isDisabled, labelClassName, testID }: Props) => {
    const accessibilityState = { disabled: isDisabled };

    return (
        <HapticPressable
            onPress={onPress}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            className={cn(
                'min-h-[50px] justify-center rounded-3xl bg-surface-row px-3xl py-lg active:opacity-70',
                isDisabled && 'opacity-40'
            )}
            style={CONTINUOUS_CORNERS}
            testID={testID}
        >
            <Text className={cn('text-[17px]', labelClassName)}>{label}</Text>
        </HapticPressable>
    );
};
