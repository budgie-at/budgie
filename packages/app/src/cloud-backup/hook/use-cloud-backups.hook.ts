import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { EMPTY_LISTING, cloudBackupListingAtom } from '../constant/cloud-backup-listing-atom.constant';
import { CloudBackupListingStatusEnum } from '../enum/cloud-backup-listing-status.enum';

export const useCloudBackups = () => {
    const result = useAtomValue(cloudBackupListingAtom);
    const refresh = useAtomRefresh(cloudBackupListingAtom);
    const listing = AsyncResult.getOrElse(result, () => ({
        ...EMPTY_LISTING,
        status: AsyncResult.isFailure(result) ? CloudBackupListingStatusEnum.FAILED : CloudBackupListingStatusEnum.READY
    }));

    return { ...listing, isLoading: AsyncResult.isInitial(result) || result.waiting, refresh };
};
