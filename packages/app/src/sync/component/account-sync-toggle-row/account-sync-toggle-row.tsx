import { SyncEntityInterface, SyncModeEnum, SyncStatusEnum, UserIconNameEnum } from '@budgie/contracts';
import { SyncProviderRegistryService, SYNC_PROVIDER_CAPABILITIES } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import * as Effect from 'effect/Effect';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { hasSyncProblem } from '../../utils/has-sync-problem.util';
import { AccountSyncCardSelector } from '../account-sync-card/account-sync-card.selector';

interface Props {
    readonly sync: Pick<SyncEntityInterface, 'accountId' | 'provider' | 'mode' | 'status' | 'enabled' | 'lastError' | 'lastWarning'>;
}

const statusTextVariants = cva('text-[13px] leading-[18px]', {
    variants: {
        status: {
            [SyncStatusEnum.FAILED]: 'text-destructive-foreground',
            [SyncStatusEnum.SYNCING]: 'text-dark-warning-foreground',
            [SyncStatusEnum.IDLE]: 'text-positive-foreground'
        }
    }
});

export const AccountSyncToggleRow = ({ sync }: Props) => {
    const { t } = useLingui();

    const handleToggle = (enabled: boolean) => {
        appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(SyncProviderRegistryService, registry => registry.setAccountSyncEnabled(sync.accountId, enabled)).pipe(
                    toastOnFailure(t`Could not update setting`)
                )
            )
        );
    };

    const isForwardMode = sync.mode === SyncModeEnum.FORWARD;
    const statusLabels: Record<SyncStatusEnum, string> = {
        [SyncStatusEnum.FAILED]: t`Sync failed`,
        [SyncStatusEnum.SYNCING]: isForwardMode ? t`Fetching new...` : t`Syncing history...`,
        [SyncStatusEnum.IDLE]: isForwardMode ? t`On` : t`Waiting`
    };
    const syncLabel = SYNC_PROVIDER_CAPABILITIES[sync.provider].supportsFileImport ? t`Include in file imports` : t`Automatic sync`;
    const offLabel = hasSyncProblem(sync) ? t`Off after an error` : t`Off`;
    const statusText =
        sync.enabled || sync.status === SyncStatusEnum.FAILED ? (
            <Text className={statusTextVariants({ status: sync.status })} testID={AccountSyncCardSelector.Status}>
                {statusLabels[sync.status]}
            </Text>
        ) : (
            <Text className="text-secondary-foreground text-[13px] leading-[18px]" testID={AccountSyncCardSelector.Status}>
                {offLabel}
            </Text>
        );

    return (
        <GroupedListRow
            left={
                <CircleIcon
                    icon={UserIconNameEnum.RefreshCw}
                    variant="secondary"
                    size={36}
                    iconSize={18}
                    radius={18}
                    border={false}
                    className="bg-surface-disc"
                />
            }
            title={syncLabel}
            subtitle={statusText}
            right={
                <ThemedSwitch
                    value={sync.enabled}
                    onValueChange={handleToggle}
                    accessibilityLabel={syncLabel}
                    testID={AccountSyncCardSelector.Switch}
                />
            }
        />
    );
};
