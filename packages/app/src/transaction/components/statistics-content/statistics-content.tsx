import { TransactionFilterInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { AnalyticsTabType } from '../../../@generic/type/analytics-tab.type';
import { RunwayContent } from '../../../runway/component/runway-content/runway-content';
import { AnalyticsHistoryBoundary } from '../../../sync/component/analytics-history-boundary/analytics-history-boundary';
import { useTransactionAccountFilterModal } from '../../context/transaction-account-filter-modal.context';
import { checkIfFiltersSelected } from '../../utils/check-if-filters-selected.util';
import { StatisticsActivityPanels } from '../statistics-activity-panels/statistics-activity-panels';
import { StatisticsFiltersMenu } from '../statistics-filters-menu/statistics-filters-menu';
import { StatisticsPeriodControl } from '../statistics-period-control/statistics-period-control';
import { TransactionFilters } from '../transaction-filters/transaction-filters';

import type { DateRangeInterface } from '@budgie/contracts';
import type { Dispatch, SetStateAction } from 'react';

interface Props {
    readonly activeTab: AnalyticsTabType;
    readonly filters: TransactionFilterInterface;
    readonly onChangeFilters: Dispatch<SetStateAction<TransactionFilterInterface>>;
}

export const StatisticsContent = ({ activeTab, filters, onChangeFilters: setFilters }: Props) => {
    const { t } = useLingui();
    const isAccessibilityTextSize = useIsAccessibilityTextSize();

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
        <View className="gap-y-2xl">
            <View className="gap-y-md">
                <StatisticsPeriodControl value={filters.date} onChange={handleChangeDate} />

                {isAccessibilityTextSize ? (
                    <StatisticsFiltersMenu filters={filters} onChange={setFilters} />
                ) : (
                    <TransactionFilters
                        accountId={null}
                        filters={filters}
                        onChange={setFilters}
                        showTypeFilter={false}
                        showDateFilter={false}
                        isClearAllVisible={hasNonDateFilters}
                    />
                )}
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
