import { TransactionFilterInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { TagStatInterface } from '../../interface/tag-stat.interface';
import { StatsByTags } from '../stats-by-tags/stats-by-tags';
import { TagsFeatureIntro } from '../tags-feature-intro/tags-feature-intro';

interface Props {
    readonly filters: TransactionFilterInterface;
    readonly income: number;
    readonly expense: number;
    readonly incomeByTag: TagStatInterface[];
    readonly expenseByTag: TagStatInterface[];
}

export const StatsByTagsPanel = ({ filters, income, expense, incomeByTag, expenseByTag }: Props) => {
    const { t } = useLingui();

    const hasIncomeStats = isNotEmptyArray(incomeByTag);
    const hasExpenseStats = isNotEmptyArray(expenseByTag);

    if (!hasIncomeStats && !hasExpenseStats) {
        return <TagsFeatureIntro />;
    }

    return (
        <View className="gap-y-7xl">
            {hasIncomeStats && (
                <StatsByTags
                    variant="positive"
                    title={t`Income by Tag`}
                    stats={incomeByTag}
                    totalAmount={income}
                    filters={filters}
                    isIncome
                />
            )}

            {hasExpenseStats && (
                <StatsByTags
                    variant="destructive"
                    title={t`Spending by Tag`}
                    stats={expenseByTag}
                    totalAmount={expense}
                    filters={filters}
                    isIncome={false}
                />
            )}
        </View>
    );
};
