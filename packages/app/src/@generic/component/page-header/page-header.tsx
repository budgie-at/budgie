import { cva } from 'class-variance-authority';
import { ClassValue } from 'cn';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { EmptyFn, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { PageHeaderSize } from '../../type/page-header-size.type';
import { cn } from '../../utils/cn.util';
import { GoBackButton } from '../go-back-button/go-back-button';

interface Props {
    readonly title: string;
    readonly left?: ReactNode;
    readonly right?: ReactNode;
    readonly bottom?: ReactNode;
    readonly onGoBack?: EmptyFn;
    readonly className?: string;
    readonly size?: PageHeaderSize;
    readonly children?: ReactNode;
}

const headerVariant = cva<{ size: Record<PageHeaderSize, ClassValue> }>('px-5xl gap-y-3xl', {
    variants: {
        size: {
            md: 'pb-md',
            lg: 'pb-7xl'
        }
    }
});

export const PageHeader = ({ size = 'lg', bottom, title, className, left, onGoBack, right, children }: Props) => (
    <View className={cn(headerVariant({ size }), className)}>
        <View className="flex-row items-center gap-x-xl">
            {isDefined(onGoBack) ? <GoBackButton onPress={onGoBack} /> : null}

            {left}

            <View className="gap-y-xs mr-auto flex-1">
                {isNotEmptyString(title) ? (
                    <Text className="text-primary font-medium text-3xl" numberOfLines={1}>
                        {title}
                    </Text>
                ) : null}

                {children}
            </View>

            {right}
        </View>

        {bottom}
    </View>
);
