import { CategoryEntityInterface, TransactionFilterInterface } from '@budgie/contracts';
import { Text } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { StatisticsCard } from '../../../@generic/component/statistics-card/statistics-card';
import { useStatisticsCardPress } from '../../../@generic/hook/use-statistics-card-press.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AnalyticsTransactionsModeEnum } from '../../../transaction/enum/analytics-transactions-mode.enum';

import { CategoryStatisticsCardSelector } from './category-statistics-card.selector';

interface Props {
    readonly category: Pick<CategoryEntityInterface, 'id' | 'icon' | 'title' | 'isDefault'>;
    readonly amount: number;
    readonly totalAmount: number;
    readonly variant: ColorPaletteVariant;
    readonly filters: TransactionFilterInterface;
    readonly isIncome: boolean;
}

export const CategoryStatisticsCard = ({ category, amount, totalAmount, variant, filters, isIncome }: Props) => {
    const isCategorized = isPositiveNumber(category.id);
    const cardTestID = isCategorized ? CategoryStatisticsCardSelector.Card(category.title) : CategoryStatisticsCardSelector.Uncategorized;

    const handlePress = useStatisticsCardPress(
        filters,
        isIncome,
        AnalyticsTransactionsModeEnum.CATEGORIZE,
        isCategorized ? { categoryId: String(category.id) } : null
    );

    return (
        <StatisticsCard
            amount={amount}
            totalAmount={totalAmount}
            variant={variant}
            isIncome={isIncome}
            cardTestID={cardTestID}
            amountTestID={CategoryStatisticsCardSelector.Amount(category.title, amount)}
            onPress={handlePress}
        >
            <CircleIcon icon={category.icon} variant={variant} />
            <Text className="mr-auto text-primary text-xs">{category.title}</Text>
        </StatisticsCard>
    );
};
