import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { TransactionFiltersSelector } from '../transaction-filters/transaction-filters.selector';

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
        <HapticPressable
            onPress={handleSelect}
            className={categoryVariants({ isSelected })}
            testID={TransactionFiltersSelector.CategoryOption(category.title)}
        >
            <CircleIcon icon={category.icon} variant="ghost" size={26} iconSize={12} />
            <Text className={cn(textVariants({ isSelected }), 'mr-auto')}>{category.title}</Text>
            {isSelected ? (
                <Icon
                    size={16}
                    icon={UserIconNameEnum.Check}
                    className="text-primary"
                    testID={TransactionFiltersSelector.CategoryOptionSelected(category.title)}
                />
            ) : null}
        </HapticPressable>
    );
};
