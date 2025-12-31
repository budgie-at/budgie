import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { BankSyncStatsInterface } from '../../interface/bank-sync-stats.interface';

interface Props {
    readonly syncState: BankSyncStatsInterface;
}

export const SyncStatusCard = ({ syncState }: Props) => {
    const { t } = useLingui();
    const { formatDayAndMonthAndYearWithTime } = useFormatDate();

    const getOverallStatus = (): string => {
        if (syncState.status === 'loading') {
            return t`Syncing`;
        }
        if (syncState.status === 'failed') {
            return t`Failed`;
        }

        return t`Idle`;
    };

    const totalErrorCount = syncState.syncs.reduce((sum, sync) => sum + sync.errorCount, 0);
    const lastError = syncState.syncs.find(sync => isNotEmptyString(sync.lastError))?.lastError;
    const [lastSyncedAt] = syncState.syncs
        .map(sync => sync.forwardSyncedAt)
        .filter(isDefined)
        .sort((dateA, dateB) => dateB.getTime() - dateA.getTime());

    return (
        <Card className="p-4xl gap-y-md">
            <View className="flex-row justify-between">
                <Text className="text-primary font-semibold text-base">
                    <Trans>Sync Status</Trans>
                </Text>
                <Text className="text-amber-600 text-sm font-medium">{getOverallStatus()}</Text>
            </View>

            <View className="gap-y-sm border-t border-secondary-corner pt-md">
                {totalErrorCount > 0 && (
                    <View className="flex-row justify-between">
                        <Text className="text-primary text-sm">
                            <Trans>Errors count</Trans>
                        </Text>
                        <Text className="text-primary text-sm font-medium">{totalErrorCount}</Text>
                    </View>
                )}
                {isNotEmptyString(lastError) && (
                    <View className="flex-row justify-between">
                        <Text className="text-primary text-sm">
                            <Trans>Error</Trans>
                        </Text>
                        <Text className="text-primary text-destructive text-xs max-w-3/5" numberOfLines={3}>
                            {lastError}
                        </Text>
                    </View>
                )}
                <View className="flex-row justify-between">
                    <Text className="text-primary text-sm">
                        <Trans>Accounts</Trans>
                    </Text>
                    <Text className="text-primary text-sm font-medium">{syncState.totalAccounts}</Text>
                </View>
                <View className="flex-row justify-between">
                    <Text className="text-primary text-sm">
                        <Trans>Transactions</Trans>
                    </Text>
                    <Text className="text-primary text-sm font-medium">{syncState.totalTransactions}</Text>
                </View>
                {isDefined(lastSyncedAt) && (
                    <View className="flex-row justify-between">
                        <Text className="text-primary text-sm">
                            <Trans>Last Sync</Trans>
                        </Text>
                        <Text className="text-primary text-sm font-medium">{formatDayAndMonthAndYearWithTime(lastSyncedAt)}</Text>
                    </View>
                )}
            </View>
        </Card>
    );
};
