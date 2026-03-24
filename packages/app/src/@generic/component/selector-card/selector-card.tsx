import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { cn } from '../../utils/cn.util';
import { HorizontalCell } from '../horizontal-cell/horizontal-cell';
import { Icon } from '../icon/icon';

interface Props<T = number> {
    readonly identifier: T;
    readonly onSelect: (identifier: T) => void;
    readonly isSelected: boolean;
    readonly allowReselect?: boolean;
    readonly className?: string;
    readonly testID?: string;
    readonly iconSlot: ReactNode;
    readonly title: ReactNode;
    readonly subtitle?: ReactNode;
    readonly verticalAlign?: 'middle' | 'top' | 'bottom';
}

const cardVariants = cva(`rounded-3xl p-3xl border-2 border-secondary-corner gap-x-xl flex-row`, {
    variants: {
        isSelected: {
            true: 'bg-secondary-background/30 border-secondary-corner',
            false: 'border-secondary-corner/50'
        },
        verticalAlign: {
            middle: 'items-center',
            top: 'items-start',
            bottom: 'items-end'
        }
    }
});

export const SelectorCard = <T = number,>(props: Props<T>) => {
    const {
        className,
        verticalAlign = 'middle',
        isSelected,
        allowReselect = false,
        title,
        subtitle,
        onSelect,
        identifier,
        iconSlot,
        testID
    } = props;
    const handleSelect = isSelected && !allowReselect ? emptyFn : () => void onSelect(identifier);

    const right = isSelected ? (
        <View className="bg-primary rounded-full p-xs">
            <Icon className="text-primary-reverse" icon={UserIconNameEnum.Check} size={16} />
        </View>
    ) : null;

    return (
        <HorizontalCell
            right={right}
            left={iconSlot}
            className={cn(cardVariants({ isSelected, verticalAlign }), className)}
            onPress={handleSelect}
            testID={testID}
        >
            <View className="gap-y-xxs flex-1 justify-center">
                <Text className="text-md font-semibold text-primary">{title}</Text>
                {subtitle}
            </View>
        </HorizontalCell>
    );
};
