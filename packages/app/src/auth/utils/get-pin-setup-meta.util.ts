import { UserIconNameEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import { BIOMETRIC_KIND_ICON } from '../constant/biometric-kind-icon.constant';
import { BiometricKindEnum } from '../enum/biometric-kind.enum';
import { PinSetupModeEnum } from '../enum/pin-setup-mode.enum';
import { PinSetupStepEnum } from '../enum/pin-setup-step.enum';
import { BiometricSetupCopyInterface } from '../interface/biometric-setup-copy.interface';

const BIOMETRIC_SETUP_COPY: Record<BiometricKindEnum, BiometricSetupCopyInterface> = {
    [BiometricKindEnum.FACE_ID]: {
        title: msg`Unlock with Face ID?`,
        description: msg`Open Budgie with a glance. Your PIN stays the key to your data.`
    },
    [BiometricKindEnum.TOUCH_ID]: {
        title: msg`Unlock with Touch ID?`,
        description: msg`Open Budgie with a touch. Your PIN stays the key to your data.`
    },
    [BiometricKindEnum.FACE_UNLOCK]: {
        title: msg`Unlock with your face?`,
        description: msg`Open Budgie with a glance. Your PIN stays the key to your data.`
    },
    [BiometricKindEnum.FINGERPRINT]: {
        title: msg`Unlock with your fingerprint?`,
        description: msg`Open Budgie with a touch. Your PIN stays the key to your data.`
    },
    [BiometricKindEnum.BIOMETRICS]: {
        title: msg`Unlock with biometrics?`,
        description: msg`Open Budgie with your face or fingerprint. Your PIN stays the key to your data.`
    }
};

export const getPinSetupMeta = (mode: PinSetupModeEnum, step: PinSetupStepEnum, biometricKind: BiometricKindEnum | null) => {
    if (mode === PinSetupModeEnum.DISABLE) {
        return {
            title: msg`Turn off app lock`,
            description: msg`Enter your PIN to turn it off. Anyone who can unlock this phone will be able to open Budgie.`,
            icon: UserIconNameEnum.LockKeyholeOpen,
            iconVariant: 'destructive' as const
        };
    }

    if (step === PinSetupStepEnum.VERIFY_OLD) {
        return {
            title: msg`Enter current PIN`,
            description: msg`Confirm it's you before choosing a new one.`,
            icon: UserIconNameEnum.KeyRound,
            iconVariant: 'secondary' as const
        };
    }

    if (step === PinSetupStepEnum.CREATE) {
        return {
            title: mode === PinSetupModeEnum.CHANGE ? msg`Choose a new PIN` : msg`Choose a PIN`,
            description:
                mode === PinSetupModeEnum.CHANGE
                    ? msg`Pick one you'll remember but others won't guess.`
                    : msg`It encrypts everything in Budgie. Pick one you'll remember but others won't guess.`,
            icon: UserIconNameEnum.LockKeyhole,
            iconVariant: 'secondary' as const
        };
    }

    if (step === PinSetupStepEnum.CONFIRM) {
        return {
            title: mode === PinSetupModeEnum.CHANGE ? msg`Confirm your new PIN` : msg`Confirm your PIN`,
            description: msg`Enter the same PIN again.`,
            icon: UserIconNameEnum.LockKeyhole,
            iconVariant: 'secondary' as const
        };
    }

    const kind = biometricKind ?? BiometricKindEnum.BIOMETRICS;

    return {
        ...BIOMETRIC_SETUP_COPY[kind],
        icon: BIOMETRIC_KIND_ICON[kind],
        iconVariant: 'positive' as const
    };
};
