import { TransactionFilterInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
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

    const hasIncomeStats = isNotEmptyArray(incomeByTag);
    const hasExpenseStats = isNotEmptyArray(expenseByTag);

    return (
        <View className="gap-y-6xl">
            <StatisticsSpendingHero filters={filters} />

            {hasExpenseStats ? (
                <StatsByTags title={t`Spending`} stats={expenseByTag} base={expense} filters={filters} type={TransactionTypeEnum.EXPENSE} />
            ) : null}

            {hasIncomeStats ? (
                <StatsByTags title={t`Income`} stats={incomeByTag} base={income} filters={filters} type={TransactionTypeEnum.INCOME} />
            ) : null}

            {hasIncomeStats || hasExpenseStats ? null : <TagsFeatureIntro />}
        </View>
    );
};
