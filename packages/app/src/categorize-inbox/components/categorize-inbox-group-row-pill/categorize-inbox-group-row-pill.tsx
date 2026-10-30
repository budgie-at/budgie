import { ReactNode } from 'react';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly className: string;
    readonly label: string;
    readonly isDisabled: boolean;
    readonly onPress: () => void;
    readonly children: ReactNode;
    readonly testID?: string;
}

const PILL_HIT_SLOP = { top: 12, bottom: 12, left: 8, right: 8 } as const;

export const CategorizeInboxGroupRowPill = ({ className, label, isDisabled, onPress, children, testID }: Props) => (
    <HapticPressable
        className={cn('shrink flex-row items-center gap-x-xs rounded-full px-sm h-[22px]', className)}
        hitSlop={PILL_HIT_SLOP}
        disabled={isDisabled}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        testID={testID}
    >
        {children}
    </HapticPressable>
);
