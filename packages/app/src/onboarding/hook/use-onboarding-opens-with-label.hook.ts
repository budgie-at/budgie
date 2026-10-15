import { useLingui } from '@lingui/react/macro';

import { useAuthContext } from '../../auth/context/auth.context';
import { useSetting } from '../../settings/hook/use-setting.hook';

export const useOnboardingOpensWithLabel = (): string => {
    const { t } = useLingui();
    const isPinEnabled = useSetting('isPinEnabled');
    const isBiometricEnabled = useSetting('isBiometricEnabled');
    const { isFaceIdAvailable } = useAuthContext();

    if (!isPinEnabled) {
        return t`This phone's lock`;
    }

    if (!isBiometricEnabled) {
        return t`Your PIN`;
    }

    return isFaceIdAvailable ? t`Your PIN · Face ID` : t`Your PIN · Fingerprint`;
};
