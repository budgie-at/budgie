import { TransactionFilterInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { getChartSwatches } from '../../../@generic/utils/get-chart-swatches.util';
import { StatisticsShareBar } from '../../../transaction/components/statistics-share-bar/statistics-share-bar';
import { StatisticsSpendingHero } from '../../../transaction/components/statistics-spending-hero/statistics-spending-hero';
import { CategoryStatInterface } from '../../interface/category-stat.interface';
import { CategoriesFeatureIntro } from '../categories-feature-intro/categories-feature-intro';
import { StatsByCategories } from '../stats-by-categories/stats-by-categories';

interface Props {
    readonly filters: TransactionFilterInterface;
    readonly incomeByCategory: readonly CategoryStatInterface[];
    readonly expenseByCategory: readonly CategoryStatInterface[];
}

const TOP_CONTRIBUTOR_COUNT = 5;
const NEUTRAL_SWATCH_CLASS_NAME = 'bg-secondary-foreground/40';

export const StatsByCategoriesPanel = ({ filters, incomeByCategory, expenseByCategory }: Props) => {
    const { t } = useLingui();

    const swatches = getChartSwatches(expenseByCategory.map(stat => stat.category?.id ?? null));
    const topSegments = expenseByCategory.slice(0, TOP_CONTRIBUTOR_COUNT).map(({ category, amount }, index) => ({
        key: String(category?.id ?? 'uncategorized'),
        label: category?.title ?? t`Uncategorized`,
        amount,
        swatchClassName: swatches[index]?.fill ?? NEUTRAL_SWATCH_CLASS_NAME
    }));
    const otherAmount = expenseByCategory.slice(TOP_CONTRIBUTOR_COUNT).reduce((sum, stat) => sum + stat.amount, 0);
    const segments =
        otherAmount > 0
            ? [...topSegments, { key: 'other', label: t`Other`, amount: otherAmount, swatchClassName: NEUTRAL_SWATCH_CLASS_NAME }]
            : topSegments;

    const hasIncomeStats = isNotEmptyArray(incomeByCategory);
    const hasExpenseStats = isNotEmptyArray(expenseByCategory);

    return (
        <View className="gap-y-6xl">
            <StatisticsSpendingHero filters={filters}>
                {hasExpenseStats ? <StatisticsShareBar segments={segments} /> : null}
            </StatisticsSpendingHero>

            {hasExpenseStats ? (
                <StatsByCategories title={t`Spending`} stats={expenseByCategory} filters={filters} type={TransactionTypeEnum.EXPENSE} />
            ) : null}

            {hasIncomeStats ? (
                <StatsByCategories title={t`Income`} stats={incomeByCategory} filters={filters} type={TransactionTypeEnum.INCOME} />
            ) : null}

            {hasIncomeStats || hasExpenseStats ? null : <CategoriesFeatureIntro />}
        </View>
    );
};
