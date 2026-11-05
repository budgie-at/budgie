import { Trans } from '@lingui/react/macro';
import { View } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { CloudRestoreContext } from '../../context/cloud-restore.context';
import { useCloudBackups } from '../../hook/use-cloud-backups.hook';
import { useRestoreCloudBackup } from '../../hook/use-restore-cloud-backup.hook';
import { CloudBackupGroup } from '../cloud-backup-group/cloud-backup-group';
import { CloudBackupRestoreNotice } from '../cloud-backup-restore-notice/cloud-backup-restore-notice';

import { CloudBackupListSelector } from './cloud-backup-list.selector';

export const CloudBackupList = () => {
    const { groups, isUnreadable, isLoading } = useCloudBackups();
    const { restore, isLoading: isRestoring } = useRestoreCloudBackup();

    const contextValue = { restore, isLoading: isRestoring };
    const isEmpty = isEmptyArray(groups) && !isUnreadable;

    return (
        <CloudRestoreContext value={contextValue}>
            <LoadingContent isLoading={isLoading || isRestoring} className="min-h-[96px]">
                <View className="gap-y-7xl" testID={CloudBackupListSelector.Root}>
                    {groups.map(group => (
                        <CloudBackupGroup key={group.installId} deviceName={group.deviceName} backups={group.backups} />
                    ))}
                    {isUnreadable ? (
                        <CloudBackupRestoreNotice>
                            <Trans>Backups made before your iCloud encrypted data was reset can't be read.</Trans>
                        </CloudBackupRestoreNotice>
                    ) : null}
                    {isEmpty ? (
                        <CloudBackupRestoreNotice>
                            <Trans>No iCloud backups found for this Apple ID yet.</Trans>
                        </CloudBackupRestoreNotice>
                    ) : null}
                </View>
            </LoadingContent>
        </CloudRestoreContext>
    );
};
