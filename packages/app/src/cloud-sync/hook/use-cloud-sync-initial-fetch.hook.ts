import { CloudSyncStatusEnum } from '@budgie/cloud-sync';
import { useAtomValue } from '@effect/atom-react/Hooks';

import { cloudSyncStatusAtom } from '../constant/cloud-sync-status-atom.constant';

export const useCloudSyncInitialFetch = () => {
    const { status, isInitialFetchComplete, fetchedRecordCount } = useAtomValue(cloudSyncStatusAtom);

    return {
        isFetching: status === CloudSyncStatusEnum.SYNCING && !isInitialFetchComplete && fetchedRecordCount > 0,
        fetchedRecordCount
    };
};
