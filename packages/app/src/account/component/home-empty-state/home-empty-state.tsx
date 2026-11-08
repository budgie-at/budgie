import { CloudSyncStatusEnum } from '@budgie/cloud-sync';
import { useAtomValue } from '@effect/atom-react/Hooks';

import { IS_CLOUD_BACKUP_SUPPORTED } from '../../../cloud-backup/constant/is-cloud-backup-supported.constant';
import { cloudSyncStatusAtom } from '../../../cloud-sync/constant/cloud-sync-status-atom.constant';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { AccountsDownloadingState } from '../accounts-downloading-state/accounts-downloading-state';
import { AccountsEmptyState } from '../accounts-empty-state/accounts-empty-state';

export const HomeEmptyState = () => {
    const isCloudSyncEnabled = useSetting('cloudSyncEnabled');
    const { status, isInitialFetchComplete, fetchedRecordCount } = useAtomValue(cloudSyncStatusAtom);

    const isDownloading =
        IS_CLOUD_BACKUP_SUPPORTED && isCloudSyncEnabled && !isInitialFetchComplete && status === CloudSyncStatusEnum.SYNCING;

    return isDownloading ? <AccountsDownloadingState fetchedRecordCount={fetchedRecordCount} /> : <AccountsEmptyState />;
};
