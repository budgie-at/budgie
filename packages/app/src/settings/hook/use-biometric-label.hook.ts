import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useAuthContext } from '../../auth/context/auth.context';
import { BiometricKindEnum } from '../../auth/enum/biometric-kind.enum';

export const useBiometricLabel = (): string | null => {
    const { t } = useLingui();
    const { biometricKind } = useAuthContext();

    const labels: Record<BiometricKindEnum, string> = {
        [BiometricKindEnum.FACE_ID]: t`Face ID`,
        [BiometricKindEnum.TOUCH_ID]: t`Touch ID`,
        [BiometricKindEnum.FACE_UNLOCK]: t`Facial recognition`,
        [BiometricKindEnum.FINGERPRINT]: t`Fingerprint`,
        [BiometricKindEnum.BIOMETRICS]: t`Biometrics`
    };

    return isDefined(biometricKind) ? labels[biometricKind] : null;
};
