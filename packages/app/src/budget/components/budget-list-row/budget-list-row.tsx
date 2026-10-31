import { ReactNode } from 'react';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly testID: string;
    readonly onPress: () => void;
    readonly children: ReactNode;
}

export const BudgetListRow = ({ testID, onPress, children }: Props) => (
    <HapticPressable accessibilityRole="button" className="min-h-[44px] gap-y-sm active:opacity-70" testID={testID} onPress={onPress}>
        {children}
    </HapticPressable>
);
