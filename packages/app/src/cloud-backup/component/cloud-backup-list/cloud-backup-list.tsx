import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { StateCard } from '../../../@generic/component/state-card/state-card';
import { SettingsPillButton } from '../../../settings/components/settings-pill-button/settings-pill-button';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { CloudRestoreContext } from '../../context/cloud-restore.context';
import { CloudBackupListingStatusEnum } from '../../enum/cloud-backup-listing-status.enum';
import { useCloudBackups } from '../../hook/use-cloud-backups.hook';
import { useICloudAccount } from '../../hook/use-icloud-account.hook';
import { useRestoreCloudBackup } from '../../hook/use-restore-cloud-backup.hook';
import { CloudBackupRestoreFileLink } from '../cloud-backup-restore-file-link/cloud-backup-restore-file-link';
import { CloudBackupRow } from '../cloud-backup-row/cloud-backup-row';

import { CloudBackupListSelector } from './cloud-backup-list.selector';

export const CloudBackupList = () => {
    const { t } = useLingui();
    const { isAvailable, isLoading: isAccountLoading } = useICloudAccount();
    const { groups, status, refresh, isLoading } = useCloudBackups();
    const { restore, isLoading: isRestoring } = useRestoreCloudBackup();
    const isBackupEnabled = useSetting('cloudBackupEnabled');

    const isBusy = isAccountLoading || isLoading || isRestoring;
    const contextValue = { restore, isLoading: isRestoring };
    const isUnreadable = status === CloudBackupListingStatusEnum.UNREADABLE;
    const hasFailed = isAvailable && status === CloudBackupListingStatusEnum.FAILED;
    const isEmpty = isAvailable && isEmptyArray(groups) && !isUnreadable && !hasFailed;
    const noBackupsBody = isBackupEnabled
        ? t`Budgie backs up to iCloud automatically. Your first backup appears here.`
        : t`Turn on iCloud backup in Settings. Your first backup appears here.`;

    return (
        <CloudRestoreContext value={contextValue}>
            <LoadingContent isLoading={isBusy} className="min-h-[96px]">
                <View className="gap-y-7xl" testID={CloudBackupListSelector.Root}>
                    {isAvailable ? null : (
                        <StateCard
                            icon={UserIconNameEnum.Cloud}
                            title={t`Sign in to see iCloud backups`}
                            description={t`Open the Settings app and sign in to your Apple Account. Backups from your iPhone and iPad appear here.`}
                            testID={CloudBackupListSelector.SignInEmptyState}
                        >
                            <CloudBackupRestoreFileLink />
                        </StateCard>
                    )}
                    {isEmpty ? (
                        <StateCard
                            icon={UserIconNameEnum.Cloud}
                            title={t`No backups yet`}
                            description={noBackupsBody}
                            testID={CloudBackupListSelector.NoBackupsEmptyState}
                        >
                            <CloudBackupRestoreFileLink />
                        </StateCard>
                    ) : null}
                    {isNotEmptyArray(groups) ? (
                        <View className="gap-y-md">
                            <View className="gap-y-7xl">
                                {groups.map(group => (
                                    <GroupedListSection key={group.installId} title={group.deviceName}>
                                        {group.backups.map(backup => (
                                            <CloudBackupRow key={backup.recordName} {...backup} />
                                        ))}
                                    </GroupedListSection>
                                ))}
                            </View>
                            <Text className="text-secondary-foreground px-3xl text-[13px] leading-[18px]">
                                <Trans>Restoring replaces all data on this iPhone. Your current data is kept for 7 days.</Trans>
                            </Text>
                        </View>
                    ) : null}
                    {hasFailed ? (
                        <StateCard
                            icon={UserIconNameEnum.CloudOff}
                            title={t`Couldn't load iCloud backups`}
                            description={t`Check your connection and try again.`}
                            testID={CloudBackupListSelector.FailedState}
                        >
                            <SettingsPillButton
                                label={t`Try again`}
                                variant="secondary"
                                onPress={refresh}
                                testID={CloudBackupListSelector.RetryButton}
                            />
                            <CloudBackupRestoreFileLink />
                        </StateCard>
                    ) : null}
                    {isUnreadable ? (
                        <Text className="text-secondary-foreground px-3xl text-[13px] leading-[18px]">
                            <Trans>Backups made before your iCloud encrypted data was reset can&apos;t be read.</Trans>
                        </Text>
                    ) : null}
                </View>
            </LoadingContent>
        </CloudRestoreContext>
    );
};
