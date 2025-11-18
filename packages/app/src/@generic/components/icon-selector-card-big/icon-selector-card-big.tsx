import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { ICONS } from '../../constant/icons.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { CircleIcon } from '../circle-icon/circle-icon';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly className?: string;
    readonly onPress: EmptyFn;
    readonly variant?: ColorPaletteVariant;
}

const cardVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('rounded-3xl border p-3xl flex-row gap-x-xl items-center', {
    variants: {
        variant: {
            default: 'border-default-corner bg-default-background',
            destructive: 'border-destructive-corner bg-destructive-background',
            positive: 'border-positive-corner bg-positive-background',
            warning: 'border-warning-corner bg-warning-background',
            'dark-warning': 'border-dark-warning-corner bg-dark-warning-background',
            ghost: 'border-secondary-corner'
        }
    }
});

export const IconSelectorCardBig = ({ className, icon, onPress, variant = 'default' }: Props) => (
    <HapticPressable onPress={onPress} className={cn(cardVariants({ variant }), className)}>
        <CircleIcon size="2_5xl" icon={ICONS[icon]} variant={variant} className="rounded-5xl" />

        <View className="gap-y-xs flex-1">
            <Text className="text-primary font-medium text-sm">{icon}</Text>
            <Text className="text-sm text-secondary-foreground">
                <Trans>Tap to change icon</Trans>
            </Text>
        </View>

        <Icon icon={ICONS.Sparkles} className="text-secondary-foreground/50" size={16} />
    </HapticPressable>
);
