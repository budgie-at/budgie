import { TransactionFilterInterface, TransactionTypeEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
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

const TOP_CONTRIBUTOR_COUNT = 3;
const NEUTRAL_SWATCH_CLASS_NAME = 'bg-secondary-foreground';

export const StatsByCategoriesPanel = ({ filters, incomeByCategory, expenseByCategory }: Props) => {
    const { t } = useLingui();
    const [isSpendingExpanded, setIsSpendingExpanded] = useState(false);
    const [isIncomeExpanded, setIsIncomeExpanded] = useState(false);

    const handleShowAllSpending = () => void setIsSpendingExpanded(true);
    const handleToggleSpending = () => void setIsSpendingExpanded(current => !current);
    const handleToggleIncome = () => void setIsIncomeExpanded(current => !current);

    const swatches = getChartSwatches(expenseByCategory.map(stat => stat.category?.id ?? null));
    const segments = expenseByCategory.slice(0, TOP_CONTRIBUTOR_COUNT).map(({ category, amount }, index) => ({
        key: String(category?.id ?? 'uncategorized'),
        label: category?.title ?? t`Uncategorized`,
        amount,
        swatchClassName: swatches[index]?.fill ?? NEUTRAL_SWATCH_CLASS_NAME
    }));
    const otherStats = expenseByCategory.slice(TOP_CONTRIBUTOR_COUNT);
    const otherAmount = otherStats.reduce((sum, stat) => sum + stat.amount, 0);
    const other =
        otherAmount > 0
            ? {
                  key: 'other',
                  label: t({ message: plural(otherStats.length, { one: 'Other · # category', other: 'Other · # categories' }) }),
                  amount: otherAmount,
                  swatchClassName: NEUTRAL_SWATCH_CLASS_NAME
              }
            : null;

    const hasIncomeStats = isNotEmptyArray(incomeByCategory);
    const hasExpenseStats = isNotEmptyArray(expenseByCategory);
    const footnote = t`Bars compare each category with the largest one.`;

    return (
        <View className="gap-y-6xl">
            <StatisticsSpendingHero filters={filters}>
                {hasExpenseStats ? <StatisticsShareBar segments={segments} other={other} onOtherPress={handleShowAllSpending} /> : null}
            </StatisticsSpendingHero>

            {hasExpenseStats ? (
                <StatsByCategories
                    title={t`Spending`}
                    footnote={footnote}
                    stats={expenseByCategory}
                    filters={filters}
                    type={TransactionTypeEnum.EXPENSE}
                    isExpanded={isSpendingExpanded}
                    onToggleExpanded={handleToggleSpending}
                />
            ) : null}

            {hasIncomeStats ? (
                <StatsByCategories
                    title={t`Income`}
                    {...(!hasExpenseStats && { footnote })}
                    stats={incomeByCategory}
                    filters={filters}
                    type={TransactionTypeEnum.INCOME}
                    isExpanded={isIncomeExpanded}
                    onToggleExpanded={handleToggleIncome}
                />
            ) : null}

            {hasIncomeStats || hasExpenseStats ? null : <CategoriesFeatureIntro />}
        </View>
    );
};
