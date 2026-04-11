import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { TransactionFiltersSelector } from '../transaction-filters/transaction-filters.selector';

interface Props {
    readonly isLast: boolean;
    readonly isFirst: boolean;
    readonly isSelected: boolean;
    readonly tag: TagEntityInterface;
    readonly onSelect: (value: number) => void;
}

const tagVariants = cva('py-xl px-3xl border border-secondary-corner flex-row items-center gap-x-xl', {
    variants: {
        isSelected: {
            true: 'bg-secondary-corner',
            false: ''
        },
        isFirst: {
            true: 'rounded-t-5xl rounded-tl-5xl'
        },
        isLast: {
            true: 'rounded-b-5xl rounded-br-5xl'
        }
    },
    compoundVariants: [
        {
            isLast: false,
            isFirst: false,
            className: 'border-b-0'
        }
    ]
});

const textVariants = cva('text-sm font-medium', {
    variants: {
        isSelected: {
            true: 'text-primary',
            false: 'text-secondary-foreground'
        }
    }
});

export const TransactionTagFilterItem = ({ onSelect, tag, isFirst, isLast, isSelected }: Props) => {
    const handleSelect = () => void onSelect(tag.id);

    return (
        <HapticPressable
            onPress={handleSelect}
            className={tagVariants({ isSelected, isFirst, isLast })}
            testID={TransactionFiltersSelector.TagOption(tag.title)}
        >
            <Text className={cn(textVariants({ isSelected }), 'mr-auto')}>#{tag.title}</Text>
            {isSelected ? (
                <Icon
                    size={16}
                    icon={UserIconNameEnum.Check}
                    className="text-primary"
                    testID={TransactionFiltersSelector.TagOptionSelected(tag.title)}
                />
            ) : null}
        </HapticPressable>
    );
};
