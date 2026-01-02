 
import { BudgetAllocationEntityInterface, CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { cn } from '../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { CategorySpending } from '../../query/use-get-spending-by-category.query';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

interface Props {
    readonly allocations: BudgetAllocationEntityInterface[];
    readonly spendingByCategory: CategorySpending[];
    readonly categories: CategoryEntityInterface[];
    readonly currencySymbol: string;
    readonly formatAmount: (value: number, symbol: string) => string;
    readonly maxItems?: number;
}

export const BudgetCategoryStats = ({
    allocations,
    spendingByCategory,
    categories,
    currencySymbol,
    formatAmount,
    maxItems = 3
}: Props) => {
    const categoryStats = allocations
        .map(allocation => {
            const category = categories.find(cat => cat.id === allocation.categoryId);
            const spending = spendingByCategory.find(sp => sp.categoryId === allocation.categoryId);
            const spent = spending?.total ?? 0;
            const planned = allocation.amount;
            const remaining = planned - spent;
            const percentage = planned > 0 ? Math.min((spent / planned) * 100, 100) : 0;
            const icon = (category?.icon ?? UserIconNameEnum.Wallet) as UserIconNameEnum;

            return {
                id: allocation.id,
                categoryId: allocation.categoryId,
                name: category?.title ?? '-',
                icon,
                planned,
                spent,
                remaining,
                percentage
            };
        })
        .sort((first, second) => second.percentage - first.percentage)
        .slice(0, maxItems);

    if (categoryStats.length === 0) {
        return null;
    }

    return (
        <View className="gap-3">
            <Text className="text-xs uppercase text-secondary-foreground">
                <Trans>Top Categories</Trans>
            </Text>

            <View className="gap-2">
                {categoryStats.map(stat => {
                    const isOverBudget = stat.spent > stat.planned;
                    const remainingClassName = cn(
                        'text-xs font-medium',
                        isOverBudget ? 'text-warning-foreground' : 'text-positive-foreground'
                    );

                    return (
                        <View key={stat.id} className="flex-row items-center gap-3 bg-card rounded-xl p-3">
                            <CircleIcon icon={stat.icon} size={32} iconSize={16} variant="secondary" border={false} />

                            <View className="flex-1 gap-1">
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-sm font-medium text-primary">{stat.name}</Text>
                                    <Text className={remainingClassName}>
                                        {formatAmount(convertFromMicroUnits(stat.remaining), currencySymbol)}
                                    </Text>
                                </View>

                                <BudgetProgressBar planned={stat.planned} actual={stat.spent} className="h-1.5" />

                                <View className="flex-row justify-between">
                                    <Text className="text-xs text-secondary-foreground">
                                        {formatAmount(convertFromMicroUnits(stat.spent), currencySymbol)}
                                    </Text>
                                    <Text className="text-xs text-secondary-foreground">
                                        {formatAmount(convertFromMicroUnits(stat.planned), currencySymbol)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};
