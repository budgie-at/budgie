import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { GroupedListSwitchRow } from '../../../@generic/component/grouped-list-switch-row/grouped-list-switch-row';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { cloudBackupStatusAtom } from '../../../cloud-backup/constant/cloud-backup-status-atom.constant';
import { CLOUD_BACKUP_STATUS_MESSAGE } from '../../../cloud-backup/constant/cloud-backup-status-message.constant';
import { CloudBackupStatusEnum } from '../../../cloud-backup/enum/cloud-backup-status.enum';
import { useFormatCloudBackupDate } from '../../../cloud-backup/hook/use-format-cloud-backup-date.hook';
import { useICloudAccount } from '../../../cloud-backup/hook/use-icloud-account.hook';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { getCloudBackupLabels } from '../../utils/get-cloud-backup-labels.util';
import { SettingsRowIcon } from '../settings-row-icon/settings-row-icon';
import { SettingsWarningSubtitle } from '../settings-warning-subtitle/settings-warning-subtitle';

export const ICloudBackupRow = () => {
    const { t } = useLingui();
    const isEnabled = useSetting('cloudBackupEnabled');
    const lastBackupAt = useSetting('lastCloudBackupAt');
    const backupStatus = useAtomValue(cloudBackupStatusAtom);
    const { isAvailable } = useICloudAccount();
    const { run, isLoading } = useSingleFlight();
    const formatBackupDate = useFormatCloudBackupDate();

    const status = isAvailable ? backupStatus : CloudBackupStatusEnum.ACCOUNT_UNAVAILABLE;
    const isAccountUnavailable = status === CloudBackupStatusEnum.ACCOUNT_UNAVAILABLE;
    const isOn = isEnabled && !isAccountUnavailable;

    const handleChange = (next: boolean) => {
        void run(updateSettingsMutation({ cloudBackupEnabled: next }).pipe(toastOnFailure(t`Could not update iCloud backup`)));
    };

    const { readyLabel, offLabel } = getCloudBackupLabels(t, lastBackupAt, formatBackupDate, isAccountUnavailable);

    const onLabel =
        status === CloudBackupStatusEnum.READY ? (
            readyLabel
        ) : (
            <SettingsWarningSubtitle>{t(CLOUD_BACKUP_STATUS_MESSAGE[status])}</SettingsWarningSubtitle>
        );
    const subtitle = isOn ? onLabel : offLabel;

    return (
        <GroupedListSwitchRow
            left={<SettingsRowIcon icon={UserIconNameEnum.CloudUpload} variant="ghost" />}
            title={t`iCloud backup`}
            subtitle={subtitle}
            value={isOn}
            testID={SettingsPageSelector.ICloudBackupCard}
            switchTestID={SettingsPageSelector.ICloudBackupSwitch}
            isLoading={isLoading}
            {...(!isAccountUnavailable && !isLoading && { onChange: handleChange })}
        />
    );
};
