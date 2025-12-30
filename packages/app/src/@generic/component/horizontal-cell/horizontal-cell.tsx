import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { ComponentProps, ReactNode } from 'react';
import { View } from 'react-native';

import { CardSizeType } from '../../type/card-size.type';
import { HorizontalCellAlignType } from '../../type/horizontal-cell-align.type';
import { cn } from '../../utils/cn.util';
import { Card } from '../card/card';

interface Props extends ComponentProps<typeof Card> {
    readonly left?: ReactNode;
    readonly right?: ReactNode;
    readonly contentClassName?: string;
    readonly align?: HorizontalCellAlignType;
}

const cardVariants = cva<{
    size: Record<CardSizeType, ClassValue>;
    align: Record<HorizontalCellAlignType, ClassValue>;
}>('flex-row gap-xl', {
    variants: {
        size: {
            sm: 'gap-x-lg',
            md: 'gap-x-xl',
            lg: 'gap-x-3xl'
        },
        align: {
            middle: 'items-center',
            top: 'items-start'
        }
    }
});

export const HorizontalCell = (props: Props) => {
    const { onPress, className, children, right, left, size = 'md', align = 'middle', contentClassName, ...rest } = props;

    return (
        <Card onPress={onPress} className={cn(cardVariants({ size, align }), className)} size={size} {...rest}>
            {left}

            <View className={cn('flex-1', contentClassName)}>{children}</View>

            {right}
        </Card>
    );
};
