import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { Text, View } from 'react-native';

import { EmptyFn, isNotEmptyString } from '@rnw-community/shared';

import { BACKGROUND_COLOR_PALETTE } from '../../constant/background-color-palette.constant';
import { ICONS } from '../../constant/icons.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { IconDisplayCardSize } from '../../type/icon-display-card-size.type';
import { cn } from '../../utils/cn.util';
import { CircleIcon } from '../circle-icon/circle-icon';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

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
    variants: { variant: BACKGROUND_COLOR_PALETTE }
});

const CIRCLE_SIZES: Record<IconDisplayCardSize, number> = {
    sm: 62,
    md: 10,
    lg: 15
};

const CIRCLE_ICON_SIZES: Record<IconDisplayCardSize, number> = {
    sm: 28,
    md: 0,
    lg: 0
};

export const IconDisplayCard = (props: Props) => {
    const { className, icon, onPress, description, hint, variant = 'default', size } = props;

    const circleSize = CIRCLE_SIZES[size];
    const circleIconSize = CIRCLE_ICON_SIZES[size];
    const cardClassName = size === 'sm' ? className : cn(cardVariants({ variant }), className);

    return (
        <HapticPressable onPress={onPress} className={cardClassName}>
            <CircleIcon
                size={circleSize}
                iconSize={circleIconSize}
                icon={ICONS[icon]}
                variant={variant}
                className="rounded-5xl"
                border={size === 'lg'}
            />

            {size === 'sm' ? null : (
                <>
                    <View className="gap-y-xs flex-1">
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
