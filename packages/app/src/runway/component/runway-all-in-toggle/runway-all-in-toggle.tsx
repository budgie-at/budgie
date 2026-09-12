import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly isAllIn: boolean;
    readonly onToggle: () => void;
}

const ICON_SIZE = 14;

const toggleVariants = cva('flex-row items-center gap-x-xs rounded-full border px-sm py-xs', {
    variants: {
        isAllIn: {
            true: 'border-warning-corner bg-warning-background',
            false: 'border-secondary-corner bg-secondary-background'
        }
    }
});

export const RunwayAllInToggle = ({ isAllIn, onToggle }: Props) => {
    const icon = isAllIn ? UserIconNameEnum.Check : UserIconNameEnum.Plus;
    const accessibilityState = { checked: isAllIn };

    return (
        <HapticPressable
            accessibilityRole="switch"
            accessibilityState={accessibilityState}
            className={toggleVariants({ isAllIn })}
            onPress={onToggle}
        >
            <Icon icon={icon} size={ICON_SIZE} className="text-secondary-foreground" />
            <Text className="text-xs font-medium text-secondary-foreground">
                <Trans>Include one-offs</Trans>
            </Text>
        </HapticPressable>
    );
};
