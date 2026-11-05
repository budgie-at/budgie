import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Text } from 'react-native';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { updateSettingsMutation } from '../../../settings/mutation/update-settings.mutation';
import { useCloudSyncStatusLabel } from '../../hook/use-cloud-sync-status-label.hook';
import { CloudSyncService } from '../../service/cloud-sync.service';

import { CloudSyncRowSelector } from './cloud-sync-row.selector';

export const CloudSyncRow = () => {
    const { t } = useLingui();
    const isEnabled = useSetting('cloudSyncEnabled');
    const { label, isHealthy } = useCloudSyncStatusLabel();
    const { run, isLoading } = useSingleFlight();

    const handleChange = (next: boolean) => {
        void run(
            updateSettingsMutation({ cloudSyncEnabled: next }).pipe(
                Effect.andThen(Effect.flatMap(CloudSyncService, cloudSyncService => cloudSyncService.reconfigure())),
                toastOnFailure(t`Could not update iCloud sync`)
            )
        );
    };

    const statusLabel = isEnabled ? label : t`Turned off`;
    const statusClassName = isEnabled && !isHealthy ? 'text-warning-foreground' : 'text-secondary-foreground';

    return (
        <SettingsRow
            icon={UserIconNameEnum.Cloud}
            variant="ghost"
            title={t`Sync across my devices`}
            testID={CloudSyncRowSelector.Card}
            subtitle={
                <Text className={cn('text-[13px] leading-[18px]', statusClassName)} numberOfLines={2}>
                    {statusLabel}
                </Text>
            }
            right={
                <LoadingContent isLoading={isLoading}>
                    <ThemedSwitch
                        value={isEnabled}
                        onValueChange={handleChange}
                        accessibilityLabel={t`Sync across my devices`}
                        testID={CloudSyncRowSelector.Switch}
                    />
                </LoadingContent>
            }
        />
    );
};
