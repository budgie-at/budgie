import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { CloudBackupListingStatusEnum } from '../../../cloud-backup/enum/cloud-backup-listing-status.enum';
import { useCloudBackups } from '../../../cloud-backup/hook/use-cloud-backups.hook';
import { useCloudSyncInitialFetch } from '../../../cloud-sync/hook/use-cloud-sync-initial-fetch.hook';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingKeySelector } from '../onboarding-key/onboarding-key.selector';

export const OnboardingICloudRestoreRow = () => {
    const { t } = useLingui();
    const { groups, status, refresh } = useCloudBackups();
    const { isFetching } = useCloudSyncInitialFetch();
    const { goToICloudRestore } = useOnboardingNavigation();
    const hasFailed = status === CloudBackupListingStatusEnum.FAILED;
    const title = hasFailed ? t`Couldn't check iCloud backups` : t`Restore from iCloud`;
    const subtitle = hasFailed ? t`Try again` : t`Backups from your devices on this Apple Account`;
    const handlePress = hasFailed ? refresh : goToICloudRestore;

    if ((!isNotEmptyArray(groups) && !hasFailed) || isFetching) {
        return null;
    }

    return (
        <GroupedListRow
            testID={OnboardingKeySelector.ICloudRestoreButton}
            left={<GroupedListIcon icon={UserIconNameEnum.CloudDownload} />}
            title={title}
            subtitle={subtitle}
            onPress={handlePress}
        />
    );
};
