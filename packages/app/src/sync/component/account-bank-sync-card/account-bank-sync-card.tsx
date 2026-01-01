import { BankSyncModeEnum, BankSyncStatusEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useAccountBankSync } from '../../hook/use-account-bank-sync.hook';
import { monobankSyncService } from '../../service/monobank-sync.service';
import { SyncDataRow } from '../sync-data-row/sync-data-row';

import { BankSyncTokenSection } from './bank-sync-token-section';

interface Props {
    readonly accountId: number;
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

export const AccountBankSyncCard = ({ accountId }: Props) => {
    const { t } = useLingui();
    const { bankSync, hasBankSync } = useAccountBankSync(accountId);
    const { formatDayAndMonthAndYearWithTime } = useFormatDate();

    if (!hasBankSync || !isDefined(bankSync)) {
        return null;
    }

    const isForwardMode = bankSync.mode === BankSyncModeEnum.FORWARD;
    const isSyncing = bankSync.status === BankSyncStatusEnum.SYNCING;
    const statusColor = getStatusColor(bankSync.status);

    const getStatusLabel = (): string => {
        if (bankSync.status === BankSyncStatusEnum.FAILED) {
            return t`Sync Failed`;
        }
        if (isSyncing) {
            return isForwardMode ? t`Fetching new...` : t`Syncing history...`;
        }
        if (isForwardMode) {
            return t`Up to date`;
        }

        return t`Waiting`;
    };

    const handleToggle = (enabled: boolean) => {
        void monobankSyncService.setAccountSyncEnabled(accountId, enabled);
    };

    return (
        <Card className="p-4xl gap-y-lg">
            <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-md">
                    <Text className="text-primary font-semibold text-base">
                        <Trans>Bank Sync</Trans>
                    </Text>
                    <Text className={`text-xs font-medium ${statusColor}`}>{getStatusLabel()}</Text>
                </View>
                <ThemedSwitch value={bankSync.enabled} onValueChange={handleToggle} />
            </View>

            <View className="gap-y-sm border-t border-secondary-corner pt-lg">
                <SyncDataRow label={t`Transactions synced`} value={String(bankSync.transactionCount)} />

                {isDefined(bankSync.forwardSyncedAt) && (
                    <SyncDataRow label={t`Last sync`} value={formatDayAndMonthAndYearWithTime(bankSync.forwardSyncedAt)} />
                )}

                {isDefined(bankSync.backwardSyncedAt) && (
                    <SyncDataRow label={t`History synced`} value={formatDayAndMonthAndYearWithTime(bankSync.backwardSyncedAt)} />
                )}

                {bankSync.errorCount > 0 && (
                    <>
                        <SyncDataRow label={t`Errors`} value={String(bankSync.errorCount)} />
                        {isNotEmptyString(bankSync.lastError) && (
                            <View className="gap-y-xs">
                                <Text className="text-primary text-xs text-muted-foreground">
                                    <Trans>Last error</Trans>
                                </Text>
                                <Text className="text-destructive text-xs" numberOfLines={2}>
                                    {bankSync.lastError}
                                </Text>
                            </View>
                        )}
                    </>
                )}

                <BankSyncTokenSection accountId={accountId} token={bankSync.token} />
            </View>
        </Card>
    );
};
