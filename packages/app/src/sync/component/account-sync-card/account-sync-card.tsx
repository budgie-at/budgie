import { ExternalSourceEnum, SyncErrorCodeEnum, SyncModeEnum, SyncStatusEnum, SyncWarningEnum } from '@budgie/contracts';
import { SyncProviderRegistryService, SYNC_PROVIDER_CAPABILITIES } from '@budgie/sync';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import * as Effect from 'effect/Effect';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { SYNC_ERROR_LABEL } from '../../constant/sync-error-label.constant';
import { useAccountSync } from '../../hook/use-account-sync.hook';
import { BinanceSyncTokenSection } from '../binance-sync-token-section/binance-sync-token-section';
import { ResyncAccount } from '../resync-account/resync-account';
import { SyncDataRow } from '../sync-data-row/sync-data-row';

import { AccountSyncCardSelector } from './account-sync-card.selector';

interface Props {
    readonly accountId: number;
}

const statusTextVariants = cva('text-xs font-medium', {
    variants: {
        status: {
            [SyncStatusEnum.FAILED]: 'text-destructive-foreground',
            [SyncStatusEnum.SYNCING]: 'text-dark-warning-foreground',
            [SyncStatusEnum.IDLE]: 'text-positive-foreground'
        }
    }
});

export const AccountSyncCard = ({ accountId }: Props) => {
    const { t } = useLingui();
    const { sync } = useAccountSync(accountId);
    const { formatDayAndMonthAndYearWithTime } = useFormatDate();

    if (!isDefined(sync)) {
        return null;
    }

    const isForwardMode = sync.mode === SyncModeEnum.FORWARD;
    const statusLabels: Record<SyncStatusEnum, string> = {
        [SyncStatusEnum.FAILED]: t`Sync Failed`,
        [SyncStatusEnum.SYNCING]: isForwardMode ? t`Fetching new...` : t`Syncing history...`,
        [SyncStatusEnum.IDLE]: isForwardMode ? t`Up to date` : t`Waiting`
    };

    const handleToggle = (enabled: boolean) => {
        appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(SyncProviderRegistryService, registry => registry.setAccountSyncEnabled(accountId, enabled)).pipe(
                    toastOnFailure(t`Could not update setting`)
                )
            )
        );
    };

    const { supportsFileImport } = SYNC_PROVIDER_CAPABILITIES[sync.provider];
    const syncLabel = supportsFileImport ? t`Include in file imports` : t`Sync`;
    const warningLabels: Record<SyncWarningEnum, string> = {
        [SyncWarningEnum.C2C_UNAVAILABLE]: t`Binance P2P orders are unavailable: the API key is missing P2P read permission.`,
        [SyncWarningEnum.REGION_UNAVAILABLE]: t(SYNC_ERROR_LABEL[SyncErrorCodeEnum.REGION_UNAVAILABLE])
    };
    const isRegionBlocked = sync.lastWarning === SyncWarningEnum.REGION_UNAVAILABLE;
    const lastErrorText =
        isNotEmptyString(sync.lastError) && isDefined(sync.lastErrorCode) ? t(SYNC_ERROR_LABEL[sync.lastErrorCode]) : sync.lastError;
    const tokenSection = sync.provider === ExternalSourceEnum.BINANCE ? <BinanceSyncTokenSection accountId={accountId} /> : null;

    return (
        <Card className="gap-y-lg">
            <View className="flex-row items-center justify-between gap-2">
                <ResyncAccount accountId={accountId} testID={AccountSyncCardSelector.ResyncButton} />
                <View className="content-center items-center">
                    <Text className="text-primary font-semibold text-base">{syncLabel}</Text>
                    <Text className={statusTextVariants({ status: sync.status })}>{statusLabels[sync.status]}</Text>
                </View>
                <View className="content-center">
                    <ThemedSwitch
                        value={sync.enabled}
                        onValueChange={handleToggle}
                        accessibilityLabel={syncLabel}
                        testID={AccountSyncCardSelector.Switch}
                    />
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

                {sync.errorCount > 0 && <SyncDataRow label={t`Errors`} value={String(sync.errorCount)} />}

                {isNotEmptyString(lastErrorText) && !isRegionBlocked && (
                    <View className="gap-y-xs">
                        <Text className="text-xs text-secondary-foreground">
                            <Trans>Last error</Trans>
                        </Text>
                        <Text
                            className="text-secondary-foreground text-destructive text-xs"
                            numberOfLines={4}
                            testID={AccountSyncCardSelector.LastError}
                        >
                            {lastErrorText}
                        </Text>
                    </View>
                )}

                {isDefined(sync.lastWarning) && (
                    <View className="gap-y-xs">
                        <Text className="text-xs text-secondary-foreground">
                            <Trans>Warning</Trans>
                        </Text>
                        <Text className="text-warning-foreground text-xs" numberOfLines={3} testID={AccountSyncCardSelector.Warning}>
                            {warningLabels[sync.lastWarning]}
                        </Text>
                    </View>
                )}

                {tokenSection}
            </View>
        </Card>
    );
};
