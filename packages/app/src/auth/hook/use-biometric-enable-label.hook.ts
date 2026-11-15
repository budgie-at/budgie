import { useLingui } from '@lingui/react/macro';

import { useAuthContext } from '../context/auth.context';
import { BiometricKindEnum } from '../enum/biometric-kind.enum';

export const useBiometricEnableLabel = (): string => {
    const { t } = useLingui();
    const { biometricKind } = useAuthContext();

    const labels: Record<BiometricKindEnum, string> = {
        [BiometricKindEnum.FACE_ID]: t`Use Face ID`,
        [BiometricKindEnum.TOUCH_ID]: t`Use Touch ID`,
        [BiometricKindEnum.FACE_UNLOCK]: t`Use face unlock`,
        [BiometricKindEnum.FINGERPRINT]: t`Use fingerprint`,
        [BiometricKindEnum.BIOMETRICS]: t`Use biometrics`
    };

    return labels[biometricKind ?? BiometricKindEnum.BIOMETRICS];
};
