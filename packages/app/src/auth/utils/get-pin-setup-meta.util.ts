import { UserIconNameEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import { PinSetupModeEnum } from '../enum/pin-setup-mode.enum';
import { PinSetupStepEnum } from '../enum/pin-setup-step.enum';

const getBiometricTitleAndDescription = (isFaceIdAvailable: boolean, isTouchIdAvailable: boolean) => {
    if (isFaceIdAvailable && !isTouchIdAvailable) {
        return {
            title: msg`Unlock with Face ID?`,
            description: msg`Open Budgie with a glance. Your PIN stays the key to your data.`,
            icon: UserIconNameEnum.ScanFace,
            iconVariant: 'positive' as const
        };
    }

    if (isTouchIdAvailable && !isFaceIdAvailable) {
        return {
            title: msg`Unlock with Touch ID?`,
            description: msg`Open Budgie with a touch. Your PIN stays the key to your data.`,
            icon: UserIconNameEnum.Fingerprint,
            iconVariant: 'positive' as const
        };
    }

    return {
        title: msg`Unlock with biometrics?`,
        description: msg`Open Budgie with Face ID or Touch ID. Your PIN stays the key to your data.`,
        icon: UserIconNameEnum.ScanFace,
        iconVariant: 'positive' as const
    };
};

export const getPinSetupMeta = (
    mode: PinSetupModeEnum,
    step: PinSetupStepEnum,
    isFaceIdAvailable: boolean,
    isTouchIdAvailable: boolean
) => {
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

    return getBiometricTitleAndDescription(isFaceIdAvailable, isTouchIdAvailable);
};
