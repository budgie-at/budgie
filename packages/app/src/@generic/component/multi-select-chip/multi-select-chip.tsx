import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props<T> {
    readonly identifier: T;
    readonly label: string;
    readonly value?: string;
    readonly isSelected: boolean;
    readonly onToggle: (identifier: T) => void;
    readonly testID?: string;
}

const chipVariants = cva('rounded-2xl border px-xl flex-row items-center gap-x-sm py-sm max-w-48', {
    variants: {
        isSelected: {
            true: 'border-primary bg-primary',
            false: 'border-secondary-corner bg-secondary-background'
        }
    }
});

const iconVariants = cva('', {
    variants: {
        isSelected: {
            true: 'text-primary-reverse',
            false: 'text-secondary-foreground'
        }
    }
});

const labelVariants = cva('text-sm font-medium', {
    variants: {
        isSelected: {
            true: 'text-primary-reverse',
            false: 'text-primary'
        }
    }
});

const valueVariants = cva('text-xs', {
    variants: {
        isSelected: {
            true: 'text-primary-reverse opacity-80',
            false: 'text-secondary-foreground'
        }
    }
});

export const MultiSelectChip = <T,>({ identifier, label, value, isSelected, onToggle, testID }: Props<T>) => {
    const handlePress = () => void onToggle(identifier);
    const icon = isSelected ? UserIconNameEnum.Check : UserIconNameEnum.Circle;

    return (
        <HapticPressable className={chipVariants({ isSelected })} onPress={handlePress} testID={testID}>
            <Icon icon={icon} className={iconVariants({ isSelected })} size={16} />

            <View>
                <Text className={labelVariants({ isSelected })}>{label}</Text>
                {isNotEmptyString(value) ? (
                    <Text className={valueVariants({ isSelected })} numberOfLines={1}>
                        {value}
                    </Text>
                ) : null}
            </View>
        </HapticPressable>
    );
};
