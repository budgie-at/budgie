import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useICloudAccount } from '../../../cloud-backup/hook/use-icloud-account.hook';
import { SettingsSwitchRow } from '../../../settings/components/settings-switch-row/settings-switch-row';
import { SettingsWarningSubtitle } from '../../../settings/components/settings-warning-subtitle/settings-warning-subtitle';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { updateSettingsMutation } from '../../../settings/mutation/update-settings.mutation';
import { useCloudSyncStatusLabel } from '../../hook/use-cloud-sync-status-label.hook';
import { CloudSyncService } from '../../service/cloud-sync.service';

import { CloudSyncRowSelector } from './cloud-sync-row.selector';

export const CloudSyncRow = () => {
    const { t } = useLingui();
    const isEnabled = useSetting('cloudSyncEnabled');
    const { isAvailable } = useICloudAccount();
    const { label, isHealthy, isSignedOut } = useCloudSyncStatusLabel();
    const { run, isLoading } = useSingleFlight();

    const isAccountUnavailable = !isAvailable || isSignedOut;
    const isOn = isEnabled && !isAccountUnavailable;

    const handleChange = (next: boolean) => {
        void run(
            updateSettingsMutation({ cloudSyncEnabled: next }).pipe(
                Effect.andThen(Effect.flatMap(CloudSyncService, cloudSyncService => cloudSyncService.reconfigure)),
                toastOnFailure(t`Could not update iCloud sync`)
            )
        );
    };

    const offLabel = isAccountUnavailable ? t`Sign in to iCloud to turn on` : t`Turned off`;
    const onLabel = isHealthy ? label : <SettingsWarningSubtitle>{label}</SettingsWarningSubtitle>;
    const subtitle = isOn ? onLabel : offLabel;

    return (
        <SettingsSwitchRow
            icon={UserIconNameEnum.RefreshCw}
            title={t`Sync across devices`}
            subtitle={subtitle}
            value={isOn}
            isLoading={isLoading}
            testID={CloudSyncRowSelector.Card}
            switchTestID={CloudSyncRowSelector.Switch}
            {...(!isAccountUnavailable && !isLoading && { onChange: handleChange })}
        />
    );
};
