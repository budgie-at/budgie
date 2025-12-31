/* eslint-disable lingui/no-unlocalized-strings */
import { BankSyncEntityInterface, BankSyncModeEnum, BankSyncStatusEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { SyncDataRow } from '../sync-data-row/sync-data-row';

interface Props {
    readonly bankSync: BankSyncEntityInterface;
    readonly onToggle: (accountId: number, enabled: boolean) => void;
}

const getStatusColor = (status: BankSyncStatusEnum): string => {
    if (status === BankSyncStatusEnum.FAILED) {
        return 'text-destructive';
    }
    if (status === BankSyncStatusEnum.SYNCING) {
        return 'text-amber-600';
    }

    return 'text-green-600';
};

export const AccountSyncCard = ({ bankSync, onToggle }: Props) => {
    const { t } = useLingui();
    const { formatDayAndMonthAndYearWithTime } = useFormatDate();
    const { account } = useGetAccountByIdQuery(bankSync.accountId);

    const isForwardMode = bankSync.mode === BankSyncModeEnum.FORWARD;
    const isSyncing = bankSync.status === BankSyncStatusEnum.SYNCING;
    const isFailed = bankSync.status === BankSyncStatusEnum.FAILED;
    const statusColor = getStatusColor(bankSync.status);

    const getStatusLabel = () => {
        if (isFailed) {
            return t`Failed`;
        }
        if (isSyncing) {
            return isForwardMode ? t`Fetching new...` : t`Syncing history...`;
        }
        if (isForwardMode) {
            return t`Up to date`;
        }

        return t`Waiting`;
    };

    const accountTitle = account?.title ?? `${t`Account`} #${bankSync.accountId}`;
    const handleToggle = (value: boolean) => {
        onToggle(bankSync.accountId, value);
    };

    return (
        <Card className="p-4xl gap-y-lg">
            <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-md">
                    <Text className="text-primary font-semibold text-base" numberOfLines={1}>
                        {accountTitle}
                    </Text>
                    <Text className={`text-xs font-medium ${statusColor}`}>{getStatusLabel()}</Text>
                </View>
                <ThemedSwitch value={bankSync.enabled} onValueChange={handleToggle} />
            </View>

            {bankSync.enabled && (
                <View className="gap-y-sm border-t border-secondary-corner pt-lg">
                    <SyncDataRow label={t`Transactions`} value={String(bankSync.transactionCount)} valueClass="text-primary font-medium" />

                    {bankSync.errorCount > 0 && (
                        <SyncDataRow label={t`Error count`} value={String(bankSync.errorCount)} valueClass="text-destructive font-medium" />
                    )}

                    {isDefined(bankSync.backwardSyncFromAt) && (
                        <SyncDataRow label={t`Backward cursor`} value={formatDayAndMonthAndYearWithTime(bankSync.backwardSyncFromAt)} />
                    )}

                    {isDefined(bankSync.backwardSyncedAt) && (
                        <SyncDataRow label={t`Backward completed`} value={formatDayAndMonthAndYearWithTime(bankSync.backwardSyncedAt)} />
                    )}

                    {isDefined(bankSync.forwardSyncFromAt) && (
                        <SyncDataRow label={t`Forward cursor`} value={formatDayAndMonthAndYearWithTime(bankSync.forwardSyncFromAt)} />
                    )}

                    {isDefined(bankSync.forwardSyncedAt) && (
                        <SyncDataRow label={t`Forward completed`} value={formatDayAndMonthAndYearWithTime(bankSync.forwardSyncedAt)} />
                    )}

                    {isNotEmptyString(bankSync.lastError) && (
                        <View className="gap-y-xs">
                            <Text className="text-primary text-xs text-muted-foreground">
                                <Trans>Last error</Trans>
                            </Text>
                            <Text className="text-destructive text-xs" numberOfLines={3}>
                                {bankSync.lastError}
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </Card>
    );
};
