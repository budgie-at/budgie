import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { ICONS } from '../../constant/icons.constant';
import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props<T extends string> {
    readonly onSelect: (language: T) => void;
    readonly isSelected: boolean;
    readonly className?: string;
    readonly emoji: string;
    readonly name: string;
    readonly code: T;
}

const cardVariants = cva(`rounded-3xl p-3xl border-2 border-secondary-corner items-center gap-x-xl flex-row`, {
    variants: {
        isSelected: {
            true: 'bg-secondary-background/30 border-secondary-corner',
            false: 'border-secondary-corner/50'
        }
    }
});

export const SelectorCard = <T extends string,>({ className, isSelected, name, onSelect, code, emoji }: Props<T>) => {
    const handleSelect = () => void onSelect(code);

    return (
        <HapticPressable disabled={isSelected} className={cn(cardVariants({ isSelected }), className)} onPress={handleSelect}>
            <View className="w-[48px] h-[48px] bg-secondary-background rounded-5xl items-center justify-center">
                <Text className="text-primary text-4xl">{emoji}</Text>
            </View>

            <View className="gap-y-xxs flex-1">
                <Text className="text-primary font-medium text-md">{name}</Text>

                <Text className="text-sm text-secondary-foreground">{code}</Text>
            </View>

            {isSelected ? (
                <View className="bg-primary rounded-full p-xs">
                    <Icon className="text-primary-reverse" icon={ICONS.Check} size={16} />
                </View>
            ) : null}
        </HapticPressable>
    );
};
