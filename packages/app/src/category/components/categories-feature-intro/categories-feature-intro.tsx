import { DEFAULT_TRANSACTION_FILTER, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { Button } from '../../../@generic/component/button/button';
import { StatsEmptyCard } from '../../../@generic/component/stats-empty-card/stats-empty-card';
import { AnalyticsPageSelector } from '../../../app/(tabs)/analytics-page.selector';
import { useGetTotalIncomeAndExpensesQuery } from '../../../transaction/query/use-get-total-income-and-expenses.query';

export const CategoriesFeatureIntro = () => {
    const { t } = useLingui();

    const allTime = useGetTotalIncomeAndExpensesQuery({ ...DEFAULT_TRANSACTION_FILTER, date: null });

    const handleAddTransaction = () => void router.push('/create-transaction/expense');

    const isLedgerEmpty = !allTime.isLoading && allTime.income === 0 && allTime.expense === 0;
    const title = isLedgerEmpty ? t`No transactions yet` : t`No spending in this period`;
    const description = isLedgerEmpty
        ? t`Add your first transaction to see where your money goes.`
        : t`Categories break your spending down automatically. Add a transaction, or choose another period.`;

    return (
        <StatsEmptyCard
            testID={AnalyticsPageSelector.CategoriesEmptyState}
            icon={UserIconNameEnum.Folder}
            title={title}
            description={description}
        >
            <Button onPress={handleAddTransaction} leftIcon={UserIconNameEnum.Plus} content={t`Add a transaction`} />
        </StatsEmptyCard>
    );
};
