import { DEFAULT_TRANSACTION_FILTER, DatePeriodEnum, TransactionFilterInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { AnalyticsTabType } from '../../../@generic/type/analytics-tab.type';
import { getDateFilterByPeriod } from '../../../@generic/utils/date/get-date-filter-by-period.util';
import { RunwayContent } from '../../../runway/component/runway-content/runway-content';
import { AnalyticsHistoryBoundary } from '../../../sync/component/analytics-history-boundary/analytics-history-boundary';
import { useTransactionAccountFilterModal } from '../../context/transaction-account-filter-modal.context';
import { checkIfFiltersSelected } from '../../utils/check-if-filters-selected.util';
import { StatisticsActivityPanels } from '../statistics-activity-panels/statistics-activity-panels';
import { StatisticsPeriodControl } from '../statistics-period-control/statistics-period-control';
import { TransactionFilters } from '../transaction-filters/transaction-filters';

import type { DateRangeInterface } from '@budgie/contracts';

interface Props {
    readonly activeTab: AnalyticsTabType;
}

export const StatisticsContent = ({ activeTab }: Props) => {
    const { t } = useLingui();
    const [filters, setFilters] = useState<TransactionFilterInterface>({
        ...DEFAULT_TRANSACTION_FILTER,
        date: getDateFilterByPeriod(DatePeriodEnum.THIS_MONTH)
    });

    const [openAccountFilter] = useTransactionAccountFilterModal();

    const handleChooseAccounts = () => {
        openAccountFilter({ value: filters.accountIds }, result => {
            if (isDefined(result)) {
                setFilters(current => ({ ...current, accountIds: result.value }));
            }
        });
    };

    const handleChangeDate = (date: DateRangeInterface | null) => void setFilters(current => ({ ...current, date }));

    const hasNonDateFilters = checkIfFiltersSelected(null, { ...filters, date: null });

    if (activeTab === 'runway') {
        return <RunwayContent />;
    }

    return (
        <View className="gap-y-3xl">
            <View className="gap-y-lg">
                <StatisticsPeriodControl value={filters.date} onChange={handleChangeDate} />

                <TransactionFilters
                    accountId={null}
                    filters={filters}
                    onChange={setFilters}
                    showTypeFilter={false}
                    showDateFilter={false}
                    isClearAllVisible={hasNonDateFilters}
                />
            </View>

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
                <StatisticsActivityPanels activeTab={activeTab} filters={filters} />
            </AnalyticsHistoryBoundary>
        </View>
    );
};
