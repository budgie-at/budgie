import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly isFixed: boolean;
    readonly onSelectFixed: () => void;
    readonly onSelectPercentage: () => void;
}

const buttonVariants = cva('flex-1 items-center py-3 rounded-xl border', {
    variants: {
        active: {
            true: 'bg-primary border-primary',
            false: 'bg-secondary-background border-secondary-corner'
        }
    },
    defaultVariants: { active: false }
});

const buttonTextVariants = cva('text-sm font-medium', {
    variants: {
        active: {
            true: 'text-primary-reverse',
            false: 'text-secondary-foreground'
        }
    },
    defaultVariants: { active: false }
});

export const AllocationTypeToggle = ({ isFixed, onSelectFixed, onSelectPercentage }: Props) => (
    <View className="flex-row gap-2 mb-4">
        <HapticPressable onPress={onSelectFixed} className={buttonVariants({ active: isFixed })}>
            <Text className={buttonTextVariants({ active: isFixed })}>
                <Trans>Fixed Amount</Trans>
            </Text>
        </HapticPressable>

        <HapticPressable onPress={onSelectPercentage} className={buttonVariants({ active: !isFixed })}>
            <Text className={buttonTextVariants({ active: !isFixed })}>
                <Trans>% of Income</Trans>
            </Text>
        </HapticPressable>
    </View>
);
