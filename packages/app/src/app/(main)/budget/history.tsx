import { BudgetPeriodSnapshotEntityInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { FlatList, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Page } from '../../../@generic/component/page/page';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BudgetHistoryRow } from '../../../budget/components/budget-history-row/budget-history-row';
import { BudgetSpendingTrendChart } from '../../../budget/components/budget-spending-trend-chart/budget-spending-trend-chart';
import { useGetActiveBudgetQuery } from '../../../budget/query/use-get-active-budget.query';
import { useGetBudgetSnapshotsQuery } from '../../../budget/query/use-get-budget-snapshots.query';
import { useGetBudgetTrendDataQuery } from '../../../budget/query/use-get-budget-trend-data.query';

const keyExtractor = (item: BudgetPeriodSnapshotEntityInterface) => String(item.id);

export default function BudgetHistoryScreen() {
    const { t } = useLingui();
    const router = useRouter();

    const { budget, isLoading: isBudgetLoading } = useGetActiveBudgetQuery();
    const { snapshots, isLoading: isSnapshotsLoading } = useGetBudgetSnapshotsQuery(budget?.id);
    const { trendData } = useGetBudgetTrendDataQuery(budget?.id);

    const handleGoBack = () => void goBackOrReplace('/budget');

    const handlePressSnapshot = (snapshot: BudgetPeriodSnapshotEntityInterface) => {
        const periodStartTimestamp = snapshot.periodStart.getTime();
        void router.push(`/budget/history/${periodStartTimestamp}`);
    };

    const isLoading = isBudgetLoading || isSnapshotsLoading;

    const renderItem = ({ item }: { item: BudgetPeriodSnapshotEntityInterface }) => {
        const handlePress = () => void handlePressSnapshot(item);

        return <BudgetHistoryRow snapshot={item} onPress={handlePress} />;
    };

    const renderHeader = () => (
        <View className="mb-xl">
            <BudgetSpendingTrendChart dataPoints={trendData} />
        </View>
    );

    const renderEmpty = () => (
        <View className="flex-1 items-center justify-center py-20">
            <Text className="text-secondary-foreground text-center">
                <Trans>No budget history yet. Complete a budget period to see history.</Trans>
            </Text>
        </View>
    );

    /* jscpd:ignore-start */
    if (isLoading || !isDefined(budget)) {
        return (
            <Page header={<PageHeader title={t`Budget History`} onGoBack={handleGoBack} />}>
                <View className="flex-1 items-center justify-center">
                    <Text className="text-secondary-foreground">
                        <Trans>Loading...</Trans>
                    </Text>
                </View>
            </Page>
        );
    }

    return (
        <Page header={<PageHeader title={t`Budget History`} onGoBack={handleGoBack} />}>
            <FlatList
                data={snapshots}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                contentContainerClassName="py-4 gap-y-3"
                showsVerticalScrollIndicator={false}
            />
        </Page>
    );
    /* jscpd:ignore-end */
}
