import { BankSyncEntityInterface, BankSyncModeEnum, BankSyncStatusEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

interface Props {
    readonly bankSync: BankSyncEntityInterface;
    readonly onToggle: (accountId: number, enabled: boolean) => void;
}

export const AccountSyncCard = ({ bankSync, onToggle }: Props) => {
    const { t } = useLingui();

    const hasCompletedBackwardSync = isDefined(bankSync.backwardSyncedAt);
    const isForwardMode = bankSync.mode === BankSyncModeEnum.FORWARD;
    const isSyncing = bankSync.status === BankSyncStatusEnum.SYNCING;
    const { formatDayAndMonthAndYearWithTime } = useFormatDate();

    const getStatusLabel = () => {
        if (bankSync.status === BankSyncStatusEnum.FAILED) {
            return t`Failed`;
        }

        if (isForwardMode && !isSyncing) {
            return t`Up to date`;
        }

        if (hasCompletedBackwardSync && !isSyncing) {
            return t`Historical sync done`;
        }

        if (isSyncing) {
            return isForwardMode ? t`Fetching new...` : t`Syncing history...`;
        }

        return t`Waiting`;
    };

    const handleToggle = (value: boolean) => {
        onToggle(bankSync.accountId, value);
    };

    const accountTitle = `${t`Account`} #${bankSync.accountId}`;

    return (
        <Card className="p-4xl gap-y-lg">
            <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-md">
                    <Text className="text-primary font-semibold text-base" numberOfLines={1}>
                        {accountTitle}
                    </Text>
                    <Text className="text-xs text-primary">{getStatusLabel()}</Text>
                </View>
                <ThemedSwitch value={bankSync.enabled} onValueChange={handleToggle} />
            </View>

            {bankSync.enabled && (
                <View className="gap-y-sm border-t border-secondary-corner pt-lg">
                    <View className="flex-row justify-between">
                        <Text className="text-primary text-xs text-muted-foreground">
                            <Trans>Transactions</Trans>
                        </Text>
                        <Text className="text-primary text-xs font-medium">{bankSync.transactionCount}</Text>
                    </View>

                    {isDefined(bankSync.backwardSyncedAt) && (
                        <View className="flex-row justify-between">
                            <Text className="text-primary text-xs text-muted-foreground">
                                <Trans>Historical sync completed</Trans>
                            </Text>
                            <Text className="text-primary text-xs">{formatDayAndMonthAndYearWithTime(bankSync.backwardSyncedAt)}</Text>
                        </View>
                    )}

                    {isDefined(bankSync.forwardSyncedAt) && (
                        <View className="flex-row justify-between">
                            <Text className="text-primary text-xs text-muted-foreground">
                                <Trans>Last sync</Trans>
                            </Text>
                            <Text className="text-primary text-xs">{formatDayAndMonthAndYearWithTime(bankSync.forwardSyncedAt)}</Text>
                        </View>
                    )}

                    {isDefined(bankSync.lastError) && (
                        <View className="flex-row justify-between">
                            <Text className="text-primary text-xs text-muted-foreground">
                                <Trans>Error</Trans>
                            </Text>
                            <Text className="text-primary text-xs text-destructive">{bankSync.lastError}</Text>
                        </View>
                    )}
                </View>
            )}
        </Card>
    );
};
