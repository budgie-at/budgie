import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props<T> {
    readonly identifier: T;
    readonly isSelected: boolean;
    readonly onToggle: (identifier: T) => void;
    readonly label: string;
    readonly value?: string;
}

const chipVariants = cva('flex-row items-center gap-x-sm px-lg py-md rounded-2xl border', {
    variants: {
        isSelected: {
            true: 'bg-ghost-background border-primary/20',
            false: 'bg-secondary-background/50 border-secondary-corner/50'
        }
    }
});

const checkContainerVariants = cva('rounded-full p-xxs', {
    variants: {
        isSelected: {
            true: 'bg-primary',
            false: 'bg-secondary-background'
        }
    }
});

const checkIconVariants = cva('', {
    variants: {
        isSelected: {
            true: 'text-primary-reverse',
            false: 'text-secondary-foreground/50'
        }
    }
});

const labelVariants = cva('text-sm font-medium', {
    variants: {
        isSelected: {
            true: 'text-primary',
            false: 'text-secondary-foreground'
        }
    }
});

export const MultiSelectChip = <T,>({ identifier, isSelected, onToggle, label, value }: Props<T>) => {
    const handleToggle = () => void onToggle(identifier);

    return (
        <HapticPressable onPress={handleToggle} className={chipVariants({ isSelected })}>
            <View className={checkContainerVariants({ isSelected })}>
                <Icon className={checkIconVariants({ isSelected })} icon={UserIconNameEnum.Check} size={10} />
            </View>
            <View className="gap-y-xxs">
                <Text className={labelVariants({ isSelected })}>{label}</Text>
                {isNotEmptyString(value) ? (
                    <Text className="text-xs text-secondary-foreground" numberOfLines={1}>
                        {value}
                    </Text>
                ) : null}
            </View>
        </HapticPressable>
    );
};
