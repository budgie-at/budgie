import { useSetting } from '../../settings/hook/use-setting.hook';

import { useAppState } from './use-app-state.hook';

export const useIsAmountProtected = (): boolean => {
    const isScreenshotProtectionEnabled = useSetting('isScreenshotProtectionEnabled');
    const { isActive } = useAppState();

    return isScreenshotProtectionEnabled && !isActive;
};
