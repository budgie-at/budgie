import { UserIconNameEnum } from '@budgie/contracts';
import { type VariantProps, cva } from 'class-variance-authority';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

const containerVariants = cva('flex-row items-center gap-x-lg');

const labelVariants = cva('text-xs uppercase', {
    variants: {
        labelColor: {
            secondary: 'text-secondary-foreground',
            primary: 'text-primary'
        }
    },
    defaultVariants: {
        labelColor: 'secondary'
    }
});

const valueVariants = cva('text-lg font-semibold', {
    variants: {
        valueColor: {
            primary: 'text-primary',
            warning: 'text-warning-foreground',
            secondary: 'text-secondary-foreground'
        }
    },
    defaultVariants: {
        valueColor: 'primary'
    }
});

const iconVariants = cva('text-secondary-foreground');

interface Props extends VariantProps<typeof valueVariants>, VariantProps<typeof labelVariants> {
    readonly label: ReactNode;
    readonly value: ReactNode;
    readonly icon: UserIconNameEnum;
    readonly variant: ColorPaletteVariant;
    readonly iconSize?: number;
    readonly circleSize?: number;
    readonly showChevron?: boolean;
    readonly onPress: () => void;
}

export const AiTransactionPreviewSelector = ({
    label,
    value,
    icon,
    variant,
    valueColor,
    labelColor,
    iconSize = 18,
    circleSize = 34,
    showChevron = true,
    onPress
}: Props) => (
    <HapticPressable onPress={onPress} className={containerVariants()}>
        <CircleIcon size={circleSize} iconSize={iconSize} icon={icon} variant={variant} />
        <View className="flex-1">
            <Text className={labelVariants({ labelColor })}>{label}</Text>
            <Text className={valueVariants({ valueColor })}>{value}</Text>
        </View>
        {showChevron ? <Icon icon={UserIconNameEnum.ChevronRight} size={20} className={iconVariants()} /> : null}
    </HapticPressable>
);
