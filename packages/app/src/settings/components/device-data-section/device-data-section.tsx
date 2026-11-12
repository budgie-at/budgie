import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useDatabaseFileSize } from '../../../@generic/drizzle/hook/use-database-file-size.hook';
import { useFormatFileSize } from '../../../@generic/hook/use-format-file-size.hook';
import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { IS_CLOUD_BACKUP_SUPPORTED } from '../../../cloud-backup/constant/is-cloud-backup-supported.constant';
import { useICloudAccount } from '../../../cloud-backup/hook/use-icloud-account.hook';
import { ImportDatabase } from '../../../import/components/import-database/import-database';
import { useSetting } from '../../hook/use-setting.hook';
import { BackupRow } from '../backup-row/backup-row';
import { SettingsRow } from '../settings-row/settings-row';

interface Props {
    readonly title: string;
}

const handleNavigateToData = () => void router.push('/settings/data');

export const DeviceDataSection = ({ title }: Props) => {
    const { t } = useLingui();
    const databaseFileSize = useDatabaseFileSize();
    const formatFileSize = useFormatFileSize();
    const lastBackupAt = useSetting('lastBackupAt');
    const isCloudBackupEnabled = useSetting('cloudBackupEnabled');
    const isCloudSyncEnabled = useSetting('cloudSyncEnabled');
    const { isAvailable } = useICloudAccount();

    const fileSize = formatFileSize(databaseFileSize);
    const isAlsoInICloud = IS_CLOUD_BACKUP_SUPPORTED && isAvailable && (isCloudBackupEnabled || isCloudSyncEnabled);
    const iCloudStorageSubtitle = isAlsoInICloud ? t`${fileSize} · Also in iCloud` : t`${fileSize} · Not in iCloud`;
    const storageSubtitle = IS_CLOUD_BACKUP_SUPPORTED ? iCloudStorageSubtitle : fileSize;
    const isProtected = (isAlsoInICloud && isCloudBackupEnabled) || isDefined(lastBackupAt);
    const missingBackupFooter = IS_CLOUD_BACKUP_SUPPORTED
        ? t`Turn on iCloud backup or save a backup file to protect your data.`
        : t`Save a backup file to protect your data.`;
    const footer = (IS_CLOUD_BACKUP_SUPPORTED && !isAvailable) || isProtected ? null : missingBackupFooter;

    return (
        <GroupedListSection title={title} footer={footer}>
            <SettingsRow
                icon={UserIconNameEnum.Smartphone}
                variant="ghost"
                title={t`Storage`}
                testID={SettingsPageSelector.YourDataCard}
                subtitle={storageSubtitle}
            />
            <BackupRow />
            <ImportDatabase />
            <SettingsRow
                onPress={handleNavigateToData}
                title={t`Data tools`}
                subtitle={t`Import, export, repair and reset`}
                icon={UserIconNameEnum.SlidersHorizontal}
                variant="ghost"
                testID={SettingsPageSelector.DataCard}
            />
        </GroupedListSection>
    );
};
