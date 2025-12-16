import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { EmptyFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { ICONS, IconName } from '../../constant/icons.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { PageHeaderSize } from '../../type/page-header-size.type';
import { cn } from '../../utils/cn.util';
import { CircleIcon } from '../circle-icon/circle-icon';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly title: string;
    readonly icon?: IconName;
    readonly right?: ReactNode;
    readonly bottom?: ReactNode;
    readonly onGoBack?: EmptyFn;
    readonly className?: string;
    readonly description?: string;
    readonly size?: PageHeaderSize;
    readonly titleClassName?: string;
    readonly descriptionClassName?: string;
    readonly iconVariant?: ColorPaletteVariant;
}

const headerVariant = cva<{ size: Record<PageHeaderSize, ClassValue> }>('px-5xl border-b border-b-secondary-corner gap-y-3xl', {
    variants: {
        size: {
            md: 'pb-md',
            lg: 'pb-7xl'
        }
    }
});

export const PageHeader = ({
    size = 'lg',
    bottom,
    title,
    className,
    description,
    iconVariant = 'default',
    descriptionClassName,
    icon,
    onGoBack,
    right
}: Props) => (
    <View className={cn(headerVariant({ size }), className)}>
        <View className="flex-row items-center gap-x-xl">
            {isDefined(onGoBack) ? (
                <HapticPressable className="p-md" onPress={onGoBack}>
                    <Icon className="text-primary" icon={ICONS.ChevronLeft} size={24} />
                </HapticPressable>
            ) : null}

            {isNotEmptyString(icon) ? <CircleIcon icon={ICONS[icon]} variant={iconVariant} size="2xl" className="rounded-3xl" /> : null}

            <View className="gap-y-xs mr-auto">
                <Text className="text-primary font-medium text-3xl">{title}</Text>

                {isNotEmptyString(description) ? (
                    <Text className={cn('text-xs text-secondary-foreground', descriptionClassName)}>{description}</Text>
                ) : null}
            </View>

            {right}
        </View>

        {bottom}
    </View>
);
