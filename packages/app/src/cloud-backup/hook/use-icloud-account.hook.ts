import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useSetting } from '../../settings/hook/use-setting.hook';
import { iCloudAccountAvailableAtom } from '../constant/icloud-account-available-atom.constant';

export const useICloudAccount = () => {
    const result = useAtomValue(iCloudAccountAvailableAtom);
    const isBackupEnabled = useSetting('cloudBackupEnabled');
    const isSyncEnabled = useSetting('cloudSyncEnabled');

    return {
        isAvailable: AsyncResult.getOrElse(result, () => isBackupEnabled || isSyncEnabled),
        isLoading: AsyncResult.isInitial(result)
    };
};
