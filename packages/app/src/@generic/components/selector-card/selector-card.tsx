import { cva } from 'class-variance-authority';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { ICONS } from '../../constant/icons.constant';
import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props<T = number> {
    readonly identifier: T;
    readonly onSelect: (identifier: T) => void;
    readonly isSelected: boolean;
    readonly className?: string;
    readonly iconSlot: ReactNode;
    readonly title: ReactNode;
    readonly subtitle?: ReactNode;
}

const cardVariants = cva(`rounded-3xl p-3xl border-2 border-secondary-corner items-center gap-x-xl flex-row`, {
    variants: {
        isSelected: {
            true: 'bg-secondary-background/30 border-secondary-corner',
            false: 'border-secondary-corner/50'
        }
    }
});

export const SelectorCard = <T = number,>({ className, isSelected, title, subtitle, onSelect, identifier, iconSlot }: Props<T>) => {
    const handleSelect = () => void onSelect(identifier);

    return (
        <HapticPressable disabled={isSelected} className={cn(cardVariants({ isSelected }), className)} onPress={handleSelect}>
            {iconSlot}

            <View className="gap-y-xxs flex-1">
                <Text className="text-md font-semibold text-primary">{title}</Text>
                {subtitle}
            </View>

            {isSelected ? (
                <View className="bg-primary rounded-full p-xs">
                    <Icon className="text-primary-reverse" icon={ICONS.Check} size={16} />
                </View>
            ) : null}
        </HapticPressable>
    );
};
