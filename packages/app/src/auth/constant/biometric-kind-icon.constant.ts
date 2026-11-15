import { UserIconNameEnum } from '@budgie/contracts';

import { BiometricKindEnum } from '../enum/biometric-kind.enum';

export const BIOMETRIC_KIND_ICON: Record<BiometricKindEnum, UserIconNameEnum> = {
    [BiometricKindEnum.FACE_ID]: UserIconNameEnum.ScanFace,
    [BiometricKindEnum.TOUCH_ID]: UserIconNameEnum.Fingerprint,
    [BiometricKindEnum.FACE_UNLOCK]: UserIconNameEnum.ScanFace,
    [BiometricKindEnum.FINGERPRINT]: UserIconNameEnum.Fingerprint,
    [BiometricKindEnum.BIOMETRICS]: UserIconNameEnum.Fingerprint
};
