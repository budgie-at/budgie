import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { CLOUD_BACKUP_STATUS_MESSAGE } from '../../../cloud-backup/constant/cloud-backup-status-message.constant';
import { CloudBackupStatusEnum } from '../../../cloud-backup/enum/cloud-backup-status.enum';
import { useCloudBackupStatus } from '../../../cloud-backup/hook/use-cloud-backup-status.hook';
import { useFormatCloudBackupDate } from '../../../cloud-backup/hook/use-format-cloud-backup-date.hook';
import { useSetting } from '../../hook/use-setting.hook';
import { updateSettingsMutation } from '../../mutation/update-settings.mutation';
import { SettingsRow } from '../settings-row/settings-row';

export const ICloudBackupRow = () => {
    const { t } = useLingui();
    const isEnabled = useSetting('cloudBackupEnabled');
    const lastBackupAt = useSetting('lastCloudBackupAt');
    const { status, isLoading } = useCloudBackupStatus();
    const { run } = useSingleFlight();
    const formatBackupDate = useFormatCloudBackupDate();

    const handleChange = (next: boolean) => {
        void run(updateSettingsMutation({ cloudBackupEnabled: next }).pipe(toastOnFailure(t`Could not update iCloud backup`)));
    };

    const lastBackupDate = isDefined(lastBackupAt) ? formatBackupDate(lastBackupAt) : '';
    const readyLabel = isDefined(lastBackupAt) ? t`Last iCloud backup: ${lastBackupDate}` : t`Not backed up to iCloud yet`;
    const activeLabel = status === CloudBackupStatusEnum.READY ? readyLabel : t(CLOUD_BACKUP_STATUS_MESSAGE[status]);
    const label = isEnabled ? activeLabel : t`Turned off`;
    const labelClassName = status === CloudBackupStatusEnum.READY || !isEnabled ? 'text-secondary-foreground' : 'text-warning-foreground';

    return (
        <SettingsRow
            icon={UserIconNameEnum.Cloud}
            variant="ghost"
            title={t`iCloud backup`}
            testID={SettingsPageSelector.ICloudBackupCard}
            subtitle={
                <LoadingContent isLoading={isLoading}>
                    <Text className={cn('text-[13px] leading-[18px]', labelClassName)} numberOfLines={2}>
                        {label}
                    </Text>
                </LoadingContent>
            }
            right={
                <ThemedSwitch
                    value={isEnabled}
                    onValueChange={handleChange}
                    accessibilityLabel={t`iCloud backup`}
                    testID={SettingsPageSelector.ICloudBackupSwitch}
                />
            }
        />
    );
};
