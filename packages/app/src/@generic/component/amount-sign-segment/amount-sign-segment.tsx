import { Text, View } from 'react-native';

import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly label: string;
    readonly selected: boolean;
    readonly onPress: () => void;
}

export const AmountSignSegment = ({ label, selected, onPress }: Props) => {
    const backgroundClassName = selected ? 'bg-primary' : 'bg-transaction-detail-row';
    const textClassName = selected ? 'text-primary-foreground' : 'text-primary';
    const accessibilityState = { selected, checked: selected };

    return (
        <HapticPressable
            accessibilityRole="radio"
            accessibilityState={accessibilityState}
            accessibilityLabel={label}
            onPress={onPress}
            className="min-h-[44px] flex-1 justify-center"
        >
            <View className={cn('min-h-[32px] items-center justify-center rounded-[8px] px-md py-xs', backgroundClassName)}>
                <Text className={cn('text-[13px] leading-[18px] font-semibold', textClassName)}>{label}</Text>
            </View>
        </HapticPressable>
    );
};
