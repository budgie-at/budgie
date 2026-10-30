import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly variant: 'positive' | 'warning';
    readonly text: string;
    readonly label: string;
    readonly isDisabled: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
}

const PILL_HIT_SLOP = { top: 10, bottom: 10, left: 8, right: 8 } as const;
const continuousCorners = { borderCurve: 'continuous' as const };

export const CategorizeInboxGroupRowPill = ({ variant, text, label, isDisabled, onPress, testID }: Props) => {
    const isPositive = variant === 'positive';
    const backgroundClassName = isPositive ? 'bg-positive-action' : 'bg-warning-fill';
    const foregroundClassName = isPositive ? 'text-positive-action-foreground' : 'text-black';

    return (
        <HapticPressable
            className={cn('h-[26px] shrink flex-row items-center rounded-full px-lg active:opacity-70', backgroundClassName)}
            style={continuousCorners}
            hitSlop={PILL_HIT_SLOP}
            disabled={isDisabled}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            testID={testID}
        >
            <Text className={cn('shrink text-[13px] font-semibold', foregroundClassName)} numberOfLines={1}>
                {text}
            </Text>
        </HapticPressable>
    );
};
