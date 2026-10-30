import { cva } from 'class-variance-authority';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

import type { UserIconNameEnum } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly isDisabled: boolean;
    readonly accessibilityLabel: string;
    readonly onPress: () => void;
    readonly testID: string;
}

const ICON_SIZE = 20;

const buttonVariants = cva('size-11 items-center justify-center rounded-full bg-primary-reverse', {
    variants: {
        isDisabled: {
            true: 'opacity-40',
            false: 'active:scale-xs'
        }
    }
});

export const InstallmentCountStepButton = ({ icon, isDisabled, accessibilityLabel, onPress, testID }: Props) => {
    const accessibilityState = { disabled: isDisabled };

    return (
        <HapticPressable
            className={buttonVariants({ isDisabled })}
            onPress={onPress}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={accessibilityState}
            hitSlop={8}
            testID={testID}
        >
            <Icon icon={icon} size={ICON_SIZE} className="text-primary" />
        </HapticPressable>
    );
};
