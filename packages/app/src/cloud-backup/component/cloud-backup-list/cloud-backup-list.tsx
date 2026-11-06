import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { CloudRestoreContext } from '../../context/cloud-restore.context';
import { useCloudBackups } from '../../hook/use-cloud-backups.hook';
import { useICloudAccount } from '../../hook/use-icloud-account.hook';
import { useRestoreCloudBackup } from '../../hook/use-restore-cloud-backup.hook';
import { CloudBackupEmptyStateCard } from '../cloud-backup-empty-state-card/cloud-backup-empty-state-card';
import { CloudBackupGroup } from '../cloud-backup-group/cloud-backup-group';
import { CloudBackupRestoreFileLink } from '../cloud-backup-restore-file-link/cloud-backup-restore-file-link';
import { CloudBackupRestoreNotice } from '../cloud-backup-restore-notice/cloud-backup-restore-notice';

import { CloudBackupListSelector } from './cloud-backup-list.selector';

export const CloudBackupList = () => {
    const { t } = useLingui();
    const { isAvailable, isLoading: isAccountLoading } = useICloudAccount();
    const { groups, isUnreadable, isLoading } = useCloudBackups();
    const { restore, isLoading: isRestoring } = useRestoreCloudBackup();
    const isBackupEnabled = useSetting('cloudBackupEnabled');

    const contextValue = { restore, isLoading: isRestoring };
    const isEmpty = isAvailable && isEmptyArray(groups) && !isUnreadable;
    const noBackupsBody = isBackupEnabled
        ? t`Budgie backs up to iCloud automatically. Your first backup appears here.`
        : t`Turn on iCloud backup in Settings. Your first backup appears here.`;

    return (
        <CloudRestoreContext value={contextValue}>
            <LoadingContent isLoading={isAccountLoading || isLoading || isRestoring} className="min-h-[96px]">
                <View className="gap-y-7xl" testID={CloudBackupListSelector.Root}>
                    {isAvailable ? null : (
                        <CloudBackupEmptyStateCard
                            icon={UserIconNameEnum.Cloud}
                            title={t`Sign in to see iCloud backups`}
                            body={t`Open the Settings app and sign in to your Apple Account. Backups from your iPhone and iPad appear here.`}
                            testID={CloudBackupListSelector.SignInEmptyState}
                        >
                            <CloudBackupRestoreFileLink />
                        </CloudBackupEmptyStateCard>
                    )}
                    {isEmpty ? (
                        <CloudBackupEmptyStateCard
                            icon={UserIconNameEnum.Cloud}
                            title={t`No backups yet`}
                            body={noBackupsBody}
                            testID={CloudBackupListSelector.NoBackupsEmptyState}
                        >
                            <CloudBackupRestoreFileLink />
                        </CloudBackupEmptyStateCard>
                    ) : null}
                    {isNotEmptyArray(groups) ? (
                        <View className="gap-y-md">
                            <View className="gap-y-7xl">
                                {groups.map(group => (
                                    <CloudBackupGroup key={group.installId} deviceName={group.deviceName} backups={group.backups} />
                                ))}
                            </View>
                            <CloudBackupRestoreNotice>
                                <Trans>Restoring replaces all data on this iPhone. Your current data is kept for 7 days.</Trans>
                            </CloudBackupRestoreNotice>
                        </View>
                    ) : null}
                    {isUnreadable ? (
                        <CloudBackupRestoreNotice>
                            <Trans>Backups made before your iCloud encrypted data was reset can't be read.</Trans>
                        </CloudBackupRestoreNotice>
                    ) : null}
                </View>
            </LoadingContent>
        </CloudRestoreContext>
    );
};
