import { DEFAULT_TRANSACTION_FILTER, DatePeriodEnum, TransactionFilterInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { ChromeScrollFrame } from '../../../@generic/component/chrome-scroll-frame/chrome-scroll-frame';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { AnalyticsTabType } from '../../../@generic/type/analytics-tab.type';
import { getDateFilterByPeriod } from '../../../@generic/utils/date/get-date-filter-by-period.util';
import { useNetWorthQuery } from '../../../account/query/use-net-worth.query';
import { RunwayContent } from '../../../runway/component/runway-content/runway-content';
import { AnalyticsHistoryBoundary } from '../../../sync/component/analytics-history-boundary/analytics-history-boundary';
import { useTransactionAccountFilterModal } from '../../context/transaction-account-filter-modal.context';
import { useGetTotalIncomeAndExpensesQuery } from '../../query/use-get-total-income-and-expenses.query';
import { checkIfFiltersSelected } from '../../utils/check-if-filters-selected.util';
import { StatisticsActivityPanels } from '../statistics-activity-panels/statistics-activity-panels';
import { TransactionAnalyticsCard } from '../transaction-analytics-card/transaction-analytics-card';
import { TransactionFilters } from '../transaction-filters/transaction-filters';

interface Props {
    readonly activeTab: AnalyticsTabType;
}

export const StatisticsContent = ({ activeTab }: Props) => {
    const { t } = useLingui();
    const [filters, setFilters] = useState<TransactionFilterInterface>({
        ...DEFAULT_TRANSACTION_FILTER,
        date: getDateFilterByPeriod(DatePeriodEnum.THIS_MONTH)
    });

    const { expense, income } = useGetTotalIncomeAndExpensesQuery(filters);
    const netWorth = useNetWorthQuery();
    const [openAccountFilter] = useTransactionAccountFilterModal();

    const handleChooseAccounts = () => {
        openAccountFilter({ value: filters.accountIds }, result => {
            if (isDefined(result)) {
                setFilters(current => ({ ...current, accountIds: result.value }));
            }
        });
    };

    const isRunwayTab = activeTab === 'runway';

    if (isRunwayTab) {
        return <RunwayContent />;
    }

    return (
        <ChromeScrollFrame>
            <TransactionFilters
                accountId={null}
                filters={filters}
                onChange={setFilters}
                showTypeFilter={false}
                isClearAllVisible={checkIfFiltersSelected(null, filters)}
            />

            <AnalyticsHistoryBoundary
                accountIds={filters.accountIds}
                description={t`We’re still importing transaction history. Wait for these accounts to finish, or select only accounts whose history is ready.`}
                action={
                    <Button
                        content={t`Choose accounts`}
                        leftIcon={UserIconNameEnum.Wallet}
                        onPress={handleChooseAccounts}
                        variant="primary"
                    />
                }
            >
                <View className="gap-y-lg">
                    <Text className="uppercase text-secondary-foreground text-xs">
                        <Trans>Overview</Trans>
                    </Text>

                    <View className="flex-row gap-x-xl">
                        <TransactionAnalyticsCard
                            amount={expense}
                            label={t`Spent`}
                            icon={UserIconNameEnum.TrendingDown}
                            variant="destructive"
                        />
                        <TransactionAnalyticsCard amount={income} label={t`Income`} icon={UserIconNameEnum.TrendingUp} variant="positive" />
                        <TransactionAnalyticsCard
                            amount={netWorth}
                            label={t`Total balance`}
                            icon={UserIconNameEnum.Wallet}
                            variant="warning"
                        />
                    </View>
                </View>

                <StatisticsActivityPanels activeTab={activeTab} filters={filters} income={income} expense={expense} />
            </AnalyticsHistoryBoundary>

            <MenuSpacer />
        </ChromeScrollFrame>
    );
};
