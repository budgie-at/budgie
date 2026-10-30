import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly variant: 'positive' | 'warning';
    readonly icon: UserIconType;
    readonly text: string;
    readonly label: string;
    readonly isDisabled: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
}

const PILL_HIT_SLOP = { top: 12, bottom: 12, left: 8, right: 8 } as const;

export const CategorizeInboxGroupRowPill = ({ variant, icon, text, label, isDisabled, onPress, testID }: Props) => {
    const isPositive = variant === 'positive';
    const backgroundClassName = isPositive ? 'bg-positive-background' : 'bg-warning-background';
    const foregroundClassName = isPositive ? 'text-positive-foreground' : 'text-warning-foreground';

    return (
        <HapticPressable
            className={cn('h-[22px] shrink flex-row items-center gap-x-xs rounded-full px-sm', backgroundClassName)}
            hitSlop={PILL_HIT_SLOP}
            disabled={isDisabled}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            testID={testID}
        >
            <Icon icon={icon} size={12} className={foregroundClassName} />
            <Text className={cn('shrink text-xs font-semibold', foregroundClassName)} numberOfLines={1}>
                {text}
            </Text>
        </HapticPressable>
    );
};
