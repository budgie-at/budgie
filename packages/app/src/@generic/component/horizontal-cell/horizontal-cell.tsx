import { cva } from 'class-variance-authority';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { EmptyFn, isNotEmptyString } from '@rnw-community/shared';

import { ICONS, IconName } from '../../constant/icons.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { Card } from '../card/card';
import { CircleIcon } from '../circle-icon/circle-icon';

interface Props {
    readonly icon: IconName;
    readonly title?: string;
    readonly onPress: EmptyFn;
    readonly right?: ReactNode;
    readonly className?: string;
    readonly description?: string;
    readonly variant: ColorPaletteVariant;
    readonly iconVariant?: ColorPaletteVariant;
    readonly titleVariant?: 'primary' | 'secondary';
}

const titleVariants = cva('text-sm font-medium', {
    variants: {
        variant: {
            primary: 'text-primary',
            secondary: 'text-primary/70'
        }
    }
});

export const HorizontalCell = (props: Props) => {
    const { variant, iconVariant, onPress, className, title, description, right, icon, titleVariant = 'primary' } = props;

    return (
        <Card onPress={onPress} className={cn('flex-row items-center gap-x-xl', className)}>
            <CircleIcon border={false} icon={ICONS[icon]} size="2xl" variant={iconVariant ?? variant} />

            <View className="flex-1">
                <Text className={titleVariants({ variant: titleVariant })}>{title}</Text>
                {isNotEmptyString(description) ? (
                    <Text className="text-sm font-medium text-secondary-foreground">{description}</Text>
                ) : null}
            </View>

            {right}
        </Card>
    );
};
