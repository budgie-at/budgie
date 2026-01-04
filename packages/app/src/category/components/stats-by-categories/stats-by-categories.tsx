import { CategoryEntityInterface, TransactionFilterInterface } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { CategoryStatisticsCard } from '../category-statistics-card/category-statistics-card';
import { UncategorizedStatisticsCard } from '../uncategorized-statistics-card/uncategorized-statistics-card';

interface Props {
    readonly title: string;
    readonly totalAmount: number;
    readonly variant: ColorPaletteVariant;
    readonly stats: { amount: number; category: CategoryEntityInterface | null }[];
    readonly filters: TransactionFilterInterface;
    readonly isIncome: boolean;
}

export const StatsByCategories = ({ title, stats, totalAmount, variant, filters, isIncome }: Props) => {
    const renderStat = ({ category, amount }: { category: CategoryEntityInterface | null; amount: number }) => {
        const microAmount = convertFromMicroUnits(amount);
        const percentage = Number((totalAmount > 0 ? (microAmount / totalAmount) * 100 : 0).toFixed(2));

        if (!isDefined(category)) {
            return (
                <UncategorizedStatisticsCard
                    key="uncategorized"
                    amount={amount}
                    percentage={percentage}
                    variant={variant}
                    filters={filters}
                    isIncome={isIncome}
                />
            );
        }

        return (
            <CategoryStatisticsCard
                key={category.id}
                category={category}
                amount={amount}
                percentage={percentage}
                variant={variant}
                filters={filters}
                isIncome={isIncome}
            />
        );
    };

    /* jscpd:ignore-start */
    return (
        <View className="gap-y-md">
            <Text className="uppercase text-secondary-foreground text-xs">{title}</Text>

            <Card className="gap-y-xl">{stats.map(renderStat)}</Card>
        </View>
    );
    /* jscpd:ignore-end */
};
