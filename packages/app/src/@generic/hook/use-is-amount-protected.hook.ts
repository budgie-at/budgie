import { useAtomValue } from '@effect/atom-react/Hooks';

import { useSetting } from '../../settings/hook/use-setting.hook';
import { appStateAtom } from '../constant/app-state-atom.constant';

export const useIsAmountProtected = (): boolean => {
    const isScreenshotProtectionEnabled = useSetting('isScreenshotProtectionEnabled');
    const appState = useAtomValue(appStateAtom);

    return isScreenshotProtectionEnabled && appState !== 'active';
};
