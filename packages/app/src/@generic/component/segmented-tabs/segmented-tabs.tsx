import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface TabOption<T> {
    readonly value: T;
    readonly label: string;
}

interface Props<T> {
    readonly options: readonly TabOption<T>[];
    readonly value: T;
    readonly onChange: (value: T) => void;
}

const tabVariants = cva('flex-1 rounded-lg py-sm', {
    variants: {
        isSelected: {
            true: 'bg-ghost-background',
            false: ''
        }
    }
});

const tabTextVariants = cva('text-center text-sm font-medium', {
    variants: {
        isSelected: {
            true: 'text-primary',
            false: 'text-secondary-foreground'
        }
    }
});

export const SegmentedTabs = <T,>({ options, value, onChange }: Props<T>) => (
    <View className="flex-row bg-secondary-background rounded-xl p-xs">
        {options.map(option => {
            const isSelected = value === option.value;
            const handleSelect = () => void onChange(option.value);

            return (
                <HapticPressable key={String(option.value)} onPress={handleSelect} className={tabVariants({ isSelected })}>
                    <Text className={tabTextVariants({ isSelected })}>{option.label}</Text>
                </HapticPressable>
            );
        })}
    </View>
);
