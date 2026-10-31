import { TransactionFilterInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { StatisticsSpendingHero } from '../../../transaction/components/statistics-spending-hero/statistics-spending-hero';
import { TagStatInterface } from '../../interface/tag-stat.interface';
import { StatsByTags } from '../stats-by-tags/stats-by-tags';
import { TagsFeatureIntro } from '../tags-feature-intro/tags-feature-intro';

interface Props {
    readonly filters: TransactionFilterInterface;
    readonly income: number;
    readonly expense: number;
    readonly incomeByTag: readonly TagStatInterface[];
    readonly expenseByTag: readonly TagStatInterface[];
}

export const StatsByTagsPanel = ({ filters, income, expense, incomeByTag, expenseByTag }: Props) => {
    const { t } = useLingui();
    const [isSpendingExpanded, setIsSpendingExpanded] = useState(false);
    const [isIncomeExpanded, setIsIncomeExpanded] = useState(false);

    const handleToggleSpending = () => void setIsSpendingExpanded(current => !current);
    const handleToggleIncome = () => void setIsIncomeExpanded(current => !current);

    const hasIncomeStats = isNotEmptyArray(incomeByTag);
    const hasExpenseStats = isNotEmptyArray(expenseByTag);
    const footnote = t`Bars compare each tag with the largest one. A transaction with several tags counts toward each of them, so shares can add up to more than 100%.`;

    return (
        <View className="gap-y-6xl">
            <StatisticsSpendingHero filters={filters} />

            {hasExpenseStats ? (
                <StatsByTags
                    title={t`Spending`}
                    footnote={footnote}
                    stats={expenseByTag}
                    base={expense}
                    filters={filters}
                    type={TransactionTypeEnum.EXPENSE}
                    isExpanded={isSpendingExpanded}
                    onToggleExpanded={handleToggleSpending}
                />
            ) : null}

            {hasIncomeStats ? (
                <StatsByTags
                    title={t`Income`}
                    {...(!hasExpenseStats && { footnote })}
                    stats={incomeByTag}
                    base={income}
                    filters={filters}
                    type={TransactionTypeEnum.INCOME}
                    isExpanded={isIncomeExpanded}
                    onToggleExpanded={handleToggleIncome}
                />
            ) : null}

            {hasIncomeStats || hasExpenseStats ? null : <TagsFeatureIntro />}
        </View>
    );
};
