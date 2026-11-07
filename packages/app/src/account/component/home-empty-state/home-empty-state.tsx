import { useAtomValue } from '@effect/atom-react/Hooks';

import { cloudSyncStatusAtom } from '../../../cloud-sync/constant/cloud-sync-status-atom.constant';
import { CloudSyncStatusEnum } from '../../../cloud-sync/enum/cloud-sync-status.enum';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { AccountsDownloadingState } from '../accounts-downloading-state/accounts-downloading-state';
import { AccountsEmptyState } from '../accounts-empty-state/accounts-empty-state';

export const HomeEmptyState = () => {
    const isCloudSyncEnabled = useSetting('cloudSyncEnabled');
    const { status, isInitialFetchComplete, fetchedRecordCount } = useAtomValue(cloudSyncStatusAtom);

    const isDownloading =
        isCloudSyncEnabled && !isInitialFetchComplete && (status === CloudSyncStatusEnum.IDLE || status === CloudSyncStatusEnum.SYNCING);

    return isDownloading ? <AccountsDownloadingState fetchedRecordCount={fetchedRecordCount} /> : <AccountsEmptyState />;
};
