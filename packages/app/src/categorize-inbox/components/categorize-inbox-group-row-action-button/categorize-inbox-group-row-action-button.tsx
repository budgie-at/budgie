import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconType;
    readonly label: string;
    readonly isDisabled: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
}

const BUTTON_HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 } as const;

export const CategorizeInboxGroupRowActionButton = ({ icon, label, isDisabled, onPress, testID }: Props) => (
    <HapticPressable
        className="size-[32px] items-center justify-center rounded-full bg-surface-fill active:opacity-70"
        hitSlop={BUTTON_HIT_SLOP}
        disabled={isDisabled}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        testID={testID}
    >
        <Icon icon={icon} size={16} className="text-primary" />
    </HapticPressable>
);
