import { BiometricKindEnum } from '../enum/biometric-kind.enum';

export interface BiometricTypesInterface {
    readonly biometricKind: BiometricKindEnum | null;
    readonly isSomeAvailable: boolean;
}
