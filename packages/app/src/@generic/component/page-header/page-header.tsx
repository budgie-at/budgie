import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { EmptyFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { PageHeaderSize } from '../../type/page-header-size.type';
import { cn } from '../../utils/cn.util';
import { CircleIcon } from '../circle-icon/circle-icon';
import { GoBackButton } from '../go-back-button/go-back-button';

interface Props {
    readonly title: string;
    readonly icon?: UserIconNameEnum;
    readonly right?: ReactNode;
    readonly bottom?: ReactNode;
    readonly onGoBack?: EmptyFn;
    readonly className?: string;
    readonly description?: string;
    readonly size?: PageHeaderSize;
    readonly titleClassName?: string;
    readonly descriptionClassName?: string;
    readonly iconVariant?: ColorPaletteVariant;
    readonly testID?: string;
    readonly titleTestID?: string;
}

const headerVariant = cva<{ size: Record<PageHeaderSize, ClassValue> }>('px-5xl gap-y-3xl', {
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
    right,
    testID,
    titleTestID
}: Props) => (
    <View testID={testID} className={cn(headerVariant({ size }), className)}>
        <View className="flex-row items-center gap-x-xl">
            {isDefined(onGoBack) ? <GoBackButton onPress={onGoBack} /> : null}

            {isNotEmptyString(icon) ? (
                <CircleIcon icon={icon} variant={iconVariant} size={50} iconSize={24} radius={16} className="rounded-3xl" />
            ) : null}

            <View className="gap-y-xs mr-auto flex-1">
                <Text testID={titleTestID} className="text-primary font-medium text-3xl" numberOfLines={1}>
                    {title}
                </Text>

                {isNotEmptyString(description) ? (
                    <Text className={cn('text-xs text-secondary-foreground', descriptionClassName)}>{description}</Text>
                ) : null}
            </View>

            {right}
        </View>

        {bottom}
    </View>
);
