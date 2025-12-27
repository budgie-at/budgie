import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/components/card/card';
import { SyncStatusEnum } from '../../enum/sync-status.enum';
import { BankSyncStateInterface } from '../../interface/bank-sync-state.interface';

interface Props {
    readonly syncState: BankSyncStateInterface;
}

export const SyncStatusCard = ({ syncState }: Props) => (
    <Card className="p-4xl">
        <View className="gap-y-md">
            <Text className="text-primary font-semibold text-base">
                <Trans>Sync Status</Trans>
            </Text>
            <View className="gap-y-sm">
                <View className="flex-row justify-between">
                    <Text className="text-primary text-sm">
                        <Trans>Status</Trans>
                    </Text>
                    <Text className="text-primary text-sm font-medium">{syncState.status}</Text>
                </View>
                {syncState.status === SyncStatusEnum.ERROR && (
                    <View className="flex-row justify-between">
                        <Text className="text-primary text-sm">
                            <Trans>Error</Trans>
                        </Text>
                        <Text className="text-primary text-sm font-medium">{syncState.error}</Text>
                    </View>
                )}
                <View className="flex-row justify-between">
                    <Text className="text-primary text-sm">
                        <Trans>Accounts</Trans>
                    </Text>
                    <Text className="text-primary text-sm font-medium">
                        {syncState.currentAccount} / {syncState.totalAccounts}
                    </Text>
                </View>
                <View className="flex-row justify-between">
                    <Text className="text-primary text-sm">
                        <Trans>Transactions</Trans>
                    </Text>
                    <Text className="text-primary text-sm font-medium">{syncState.totalTransactions}</Text>
                </View>
                {isNotEmptyString(syncState.lastSyncAt) && (
                    <View className="flex-row justify-between">
                        <Text className="text-primary text-sm">
                            <Trans>Last Sync</Trans>
                        </Text>
                        <Text className="text-primary text-sm font-medium">{new Date(syncState.lastSyncAt).toLocaleString()}</Text>
                    </View>
                )}
            </View>
        </View>
    </Card>
);
