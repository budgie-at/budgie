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
    readonly fontScale?: number;
    readonly label: string;
    readonly onPress: EmptyFn;
    readonly variant?: MenuItemVariant;
    readonly rightLabel?: string | null;
    readonly subtitle?: string;
    readonly testID?: string;
}

const MAX_MENU_ICON_SCALE = 1.75;
const MENU_LABEL_LINE_HEIGHT = 21;

const containerClassName = cva('flex-row items-center gap-x-lg px-xl py-lg active:bg-secondary-background', {
    variants: { isAdaptive: { true: 'min-h-[44px]' } }
});

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

export const PopoverMenuItem = (props: Props) => {
    const { icon, fontScale, label, onPress, variant = 'default', rightLabel, subtitle, testID } = props;

    const iconSize = 20 * Math.min(fontScale ?? 1, MAX_MENU_ICON_SCALE);
    const iconStyle = {
        ...(isDefined(fontScale) && {
            alignSelf: 'flex-start' as const,
            marginTop: Math.max((MENU_LABEL_LINE_HEIGHT * fontScale - iconSize) / 2, 0)
        })
    };

    return (
        <HapticPressable
            onPress={onPress}
            className={containerClassName({ isAdaptive: isDefined(fontScale) })}
            accessibilityRole="menuitem"
            testID={testID}
        >
            <Icon icon={icon} size={iconSize} style={iconStyle} className={iconVariants({ variant })} />
            <View className="grow shrink">
                <Text className={textVariants({ variant })}>{label}</Text>
                {isNotEmptyString(subtitle) ? (
                    <Text className="mt-xxs text-[13px] leading-[19px] text-popover-secondary">{subtitle}</Text>
                ) : null}
            </View>
            {isDefined(rightLabel) ? <Text className="text-sm text-secondary-foreground">{rightLabel}</Text> : null}
        </HapticPressable>
    );
};
