import { Text, View } from 'react-native';

import { HapticPressFeedbackEnum } from '../../enum/haptic-press-feedback.enum';
import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly label: string;
    readonly selected: boolean;
    readonly onPress: () => void;
}

export const AmountSignSegment = ({ label, selected, onPress }: Props) => {
    const backgroundClassName = selected ? 'bg-cta-background' : 'bg-transparent';
    const textClassName = selected ? 'text-cta-foreground' : 'text-primary';
    const accessibilityState = { selected, checked: selected };

    return (
        <HapticPressable
            accessibilityRole="radio"
            accessibilityState={accessibilityState}
            accessibilityLabel={label}
            onPress={onPress}
            pressFeedback={HapticPressFeedbackEnum.SELECTION}
            className="min-h-[44px] flex-1 justify-center"
        >
            <View className={cn('min-h-[44px] items-center justify-center rounded-[7px] px-[4px]', backgroundClassName)}>
                <Text className={cn('text-[13px] leading-[18px] font-semibold', textClassName)}>{label}</Text>
            </View>
        </HapticPressable>
    );
};
