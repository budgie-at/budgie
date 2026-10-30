import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ClassValue } from 'cn';
import { Text, View } from 'react-native';

import { EmptyFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

type MenuItemVariant = 'default' | 'destructive';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly onPress: EmptyFn;
    readonly variant?: MenuItemVariant;
    readonly rightLabel?: string | null;
    readonly subtitle?: string;
    readonly testID?: string;
}

const containerClassName = cva('flex-row items-center gap-x-lg px-xl py-lg active:bg-secondary-background');

const textVariants = cva<{ variant: Record<MenuItemVariant, ClassValue> }>('text-base font-medium', {
    variants: {
        variant: {
            default: 'text-primary',
            destructive: 'text-destructive-foreground'
        }
    },
    defaultVariants: { variant: 'default' }
});

const iconVariants = cva<{ variant: Record<MenuItemVariant, ClassValue> }>('', {
    variants: {
        variant: {
            default: 'text-secondary-foreground',
            destructive: 'text-destructive-foreground'
        }
    },
    defaultVariants: { variant: 'default' }
});

export const PopoverMenuItem = ({ icon, label, onPress, variant = 'default', rightLabel, subtitle, testID }: Props) => (
    <HapticPressable onPress={onPress} className={containerClassName()} accessibilityRole="menuitem" testID={testID}>
        <Icon icon={icon} size={20} className={iconVariants({ variant })} />
        <View className="flex-1">
            <Text className={textVariants({ variant })}>{label}</Text>
            {isNotEmptyString(subtitle) ? <Text className="text-[13px] leading-[18px] text-secondary-foreground">{subtitle}</Text> : null}
        </View>
        {isDefined(rightLabel) ? <Text className="text-sm text-secondary-foreground">{rightLabel}</Text> : null}
    </HapticPressable>
);
