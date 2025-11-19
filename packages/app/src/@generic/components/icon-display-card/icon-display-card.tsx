import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { Text, View } from 'react-native';

import { EmptyFn, isNotEmptyString } from '@rnw-community/shared';

import { ICONS } from '../../constant/icons.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { IconDisplayCardSize } from '../../type/icon-display-card-size.type';
import { cn } from '../../utils/cn.util';
import { CircleIcon } from '../circle-icon/circle-icon';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

import type { CircleIconSize } from '../../type/circle-icon-size.type';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly hint?: string;
    readonly className?: string;
    readonly description?: string;
    readonly onPress: EmptyFn;
    readonly variant?: ColorPaletteVariant;
    readonly size: IconDisplayCardSize;
    readonly showSparkles?: boolean;
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

const CIRCLE_ICON_SIZES: Record<IconDisplayCardSize, CircleIconSize> = {
    sm: '3xl',
    md: '1_25xl',
    lg: '2_5xl'
};

export const IconDisplayCard = (props: Props) => {
    const { className, icon, onPress, description, hint, variant = 'default', size } = props;

    const circleSize = CIRCLE_ICON_SIZES[size];
    const cardClassName = size === 'sm' ? className : cn(cardVariants({ variant }), className);

    return (
        <HapticPressable onPress={onPress} className={cardClassName}>
            <CircleIcon size={circleSize} icon={ICONS[icon]} variant={variant} className="rounded-5xl" border={size === 'lg'} />

            {size === 'sm' ? null : (
                <>
                    <View className={'gap-y-xs flex-1'}>
                        <Text className="text-primary font-medium text-sm">{icon}</Text>

                        {isNotEmptyString(description) && <Text className="text-sm text-secondary-foreground">{description}</Text>}
                    </View>

                    <View className="flex-row items-center gap-x-sm">
                        <Icon icon={ICONS.Sparkles} className="text-secondary-foreground/50" size={16} />

                        {isNotEmptyString(hint) ? <Text className="text-xs text-secondary-foreground">{hint}</Text> : null}
                    </View>
                </>
            )}
        </HapticPressable>
    );
};
