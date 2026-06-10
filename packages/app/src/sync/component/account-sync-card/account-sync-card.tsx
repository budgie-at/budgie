import { SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useAccountSync } from '../../hook/use-account-sync.hook';
import { syncProviderRegistryService } from '../../service/sync-provider-registry.service';
import { buildSyncStatusLabel } from '../../utils/build-sync-status-label.util';
import { ResyncAccount } from '../resync-account/resync-account';
import { SyncDataRow } from '../sync-data-row/sync-data-row';
import { SyncTokenSection } from '../sync-token-section/sync-token-section';

interface Props {
    readonly accountId: number;
}

const statusTextVariants = cva('text-xs font-medium', {
    variants: {
        status: {
            [SyncStatusEnum.FAILED]: 'text-destructive',
            [SyncStatusEnum.SYNCING]: 'text-amber-600',
            [SyncStatusEnum.IDLE]: 'text-green-600'
        }
    }
});

export const AccountSyncCard = ({ accountId }: Props) => {
    const { t } = useLingui();
    const { sync, hasSync } = useAccountSync(accountId);
    const { formatDayAndMonthAndYearWithTime } = useFormatDate();

    if (!hasSync || !isDefined(sync)) {
        return null;
    }

    const isForwardMode = sync.mode === SyncModeEnum.FORWARD;
    const isSyncing = sync.status === SyncStatusEnum.SYNCING;
    const statusLabel = buildSyncStatusLabel({ status: sync.status, isForwardMode, isSyncing });

    const handleToggle = (enabled: boolean) => {
        void syncProviderRegistryService
            .getServiceForAccount(accountId)
            .then(service => service?.setAccountSyncEnabled(accountId, enabled));
    };

    const providerService = syncProviderRegistryService.getServiceForProvider(sync.provider);
    const supportsTokenAuth = providerService?.supportsTokenAuth === true;

    return (
        <Card className="p-4xl gap-y-lg">
            <View className="flex-row items-center justify-between gap-2">
                <ResyncAccount accountId={accountId} />
                <View className="content-center items-center">
                    <Text className="text-primary font-semibold text-base">
                        <Trans>Sync</Trans>
                    </Text>
                    <Text className={statusTextVariants({ status: sync.status })}>{statusLabel}</Text>
                </View>
                <View className="content-center">
                    <ThemedSwitch value={sync.enabled} onValueChange={handleToggle} />
                </View>
            </View>

            <View className="gap-y-sm border-t border-secondary-corner pt-lg">
                <SyncDataRow label={t`Transactions synced`} value={String(sync.transactionCount)} />

                {isDefined(sync.forwardSyncedAt) && (
                    <SyncDataRow label={t`Last sync`} value={formatDayAndMonthAndYearWithTime(sync.forwardSyncedAt)} />
                )}

                {isDefined(sync.backwardSyncedAt) && (
                    <SyncDataRow label={t`History synced`} value={formatDayAndMonthAndYearWithTime(sync.backwardSyncedAt)} />
                )}

                {sync.errorCount > 0 && (
                    <>
                        <SyncDataRow label={t`Errors`} value={String(sync.errorCount)} />
                        {isNotEmptyString(sync.lastError) && (
                            <View className="gap-y-xs">
                                <Text className="text-xs text-secondary-foreground">
                                    <Trans>Last error</Trans>
                                </Text>
                                <Text className="text-secondary-foreground text-destructive text-xs" numberOfLines={2}>
                                    {sync.lastError}
                                </Text>
                            </View>
                        )}
                    </>
                )}

                {supportsTokenAuth && <SyncTokenSection accountId={accountId} token={sync.token} />}
            </View>
        </Card>
    );
};
