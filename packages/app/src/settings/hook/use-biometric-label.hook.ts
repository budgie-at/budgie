import { useLingui } from '@lingui/react/macro';
import { Platform } from 'react-native';

import { useAuthContext } from '../../auth/context/auth.context';

export const useBiometricLabel = (): string | null => {
    const { t } = useLingui();
    const { isFaceIdAvailable, isTouchIdAvailable } = useAuthContext();

    if (isFaceIdAvailable) {
        return t`Face ID`;
    }

    if (isTouchIdAvailable) {
        return Platform.OS === 'ios' ? t`Touch ID` : t`Fingerprint`;
    }

    return null;
};
