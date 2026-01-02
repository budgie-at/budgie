import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

const spentTextVariants = cva('text-xs font-medium', {
    variants: {
        status: {
            overBudget: 'text-warning-foreground',
            normal: 'text-primary'
        }
    }
});

interface CategoryStat {
    name: string;
    icon: UserIconNameEnum;
    spentFormatted: string;
    percentage: number;
    isOverBudget: boolean;
}

interface Props {
    readonly categories: readonly CategoryStat[];
    readonly remainingCount: number;
}

export const HistoricalCategoryBreakdown = ({ categories, remainingCount }: Props) => (
    <>
        {categories.map(cat => (
            <View key={cat.name} className="flex-row items-center gap-2">
                <Icon icon={cat.icon} size={12} className="text-secondary-foreground" />
                <Text className="flex-1 text-xs text-primary" numberOfLines={1}>
                    {cat.name}
                </Text>
                <Text className={spentTextVariants({ status: cat.isOverBudget ? 'overBudget' : 'normal' })}>
                    {cat.spentFormatted}
                </Text>
                <Text className="text-xs text-secondary-foreground w-8 text-right">{cat.percentage}%</Text>
            </View>
        ))}
        {remainingCount > 0 && <Text className="text-xs text-secondary-foreground text-center">+{remainingCount} more</Text>}
    </>
);

