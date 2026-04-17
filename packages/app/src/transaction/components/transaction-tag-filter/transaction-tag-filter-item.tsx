import { TagEntityInterface } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { FilterRow } from '../../../@generic/component/filter-sheet/filter-row/filter-row';
import { FilterRowCheck } from '../../../@generic/component/filter-sheet/filter-row-check/filter-row-check';
import { FilterRowTitle } from '../../../@generic/component/filter-sheet/filter-row-title/filter-row-title';
import { TransactionFiltersSelector as TransactionFiltersSelectors } from '../transaction-filters/transaction-filters.selector';

interface Props {
    readonly isSelected: boolean;
    readonly tag: TagEntityInterface;
    readonly onSelect: (value: number) => void;
}

const hashBadgeVariants = cva('h-8 w-8 items-center justify-center rounded-full', {
    variants: {
        isSelected: {
            true: 'bg-primary',
            false: 'bg-secondary-background'
        }
    }
});

const hashTextVariants = cva('text-sm font-bold', {
    variants: {
        isSelected: {
            true: 'text-primary-reverse',
            false: 'text-secondary-foreground'
        }
    }
});

export const TransactionTagFilterItem = ({ onSelect, tag, isSelected }: Props) => {
    const handleSelect = () => void onSelect(tag.id);

    return (
        <FilterRow isSelected={isSelected} onPress={handleSelect} testID={TransactionFiltersSelectors.TagOption(tag.title)}>
            <View className={hashBadgeVariants({ isSelected })}>
                <Text className={hashTextVariants({ isSelected })}>#</Text>
            </View>
            <FilterRowTitle>{tag.title}</FilterRowTitle>
            <FilterRowCheck isSelected={isSelected} testID={TransactionFiltersSelectors.TagOptionSelected(tag.title)} />
        </FilterRow>
    );
};
