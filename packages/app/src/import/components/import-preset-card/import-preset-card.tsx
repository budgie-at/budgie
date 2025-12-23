import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly title: string;
    readonly description: string;
    readonly isSelected: boolean;
    readonly onSelect: () => void;
}

const cardVariants = cva('flex-1 rounded-2xl border p-xl gap-y-md', {
    variants: {
        isSelected: {
            true: 'border-primary bg-primary/10',
            false: 'border-secondary-corner bg-secondary-background'
        }
    }
});

const iconContainerVariants = cva('w-10 h-10 rounded-xl items-center justify-center', {
    variants: {
        isSelected: {
            true: 'bg-primary',
            false: 'bg-secondary-reverse-background/10'
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

const titleVariants = cva('font-semibold text-md', {
    variants: {
        isSelected: {
            true: 'text-primary',
            false: 'text-primary'
        }
    }
});

const descriptionVariants = cva('text-sm', {
    variants: {
        isSelected: {
            true: 'text-secondary-foreground',
            false: 'text-secondary-foreground'
        }
    }
});

const checkIconContainerVariants = cva('w-6 h-6 rounded-full items-center justify-center', {
    variants: {
        isSelected: {
            true: 'bg-primary',
            false: 'border border-secondary-corner'
        }
    }
});

export const ImportPresetCard = ({ title, description, isSelected, onSelect }: Props) => (
    <HapticPressable className={cardVariants({ isSelected })} onPress={onSelect}>
        <View className="flex-row items-center justify-between">
            <View className={iconContainerVariants({ isSelected })}>
                <Icon icon={ICONS.Database} size={20} className={iconVariants({ isSelected })} />
            </View>
            <View className={checkIconContainerVariants({ isSelected })}>
                {isSelected && <Icon icon={ICONS.Check} size={14} className="text-primary-reverse" />}
            </View>
        </View>
        <View className="gap-y-xs">
            <Text className={titleVariants({ isSelected })}>{title}</Text>
            <Text className={descriptionVariants({ isSelected })} numberOfLines={2}>
                {description}
            </Text>
        </View>
    </HapticPressable>
);
