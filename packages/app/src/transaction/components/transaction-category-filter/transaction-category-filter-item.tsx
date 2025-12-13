import { CategoryEntityInterface } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly isSelected: boolean;
    readonly onSelect: (value: number) => void;
    readonly category: CategoryEntityInterface;
}

const categoryVariants = cva('py-xl px-3xl border border-secondary-corner rounded-5xl flex-row items-center gap-x-xl', {
    variants: {
        isSelected: {
            true: 'bg-secondary-corner',
            false: ''
        }
    }
});

const textVariants = cva('text-sm font-medium', {
    variants: {
        isSelected: {
            true: 'text-primary',
            false: 'text-secondary-foreground'
        }
    }
});

export const TransactionCategoryFilterItem = ({ onSelect, category, isSelected }: Props) => {
    const handleSelect = () => void onSelect(category.id);

    return (
        <HapticPressable onPress={handleSelect} className={categoryVariants({ isSelected })}>
            <CircleIcon icon={ICONS[category.icon]} variant="ghost" size="sm" />
            <Text className={cn(textVariants({ isSelected }), 'mr-auto')}>{category.title}</Text>
            {isSelected ? <Icon size={16} icon={ICONS.Check} className="text-primary" /> : null}
        </HapticPressable>
    );
};
