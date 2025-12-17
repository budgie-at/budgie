import { msg } from '@lingui/core/macro';

import { PIN_LENGTH } from '../constant/pin-length.constant';
import { PinSetupModeEnum } from '../enum/pin-setup-mode.enum';
import { PinSetupStepEnum } from '../enum/pin-setup-step.enum';

const getBiometricTitleAndDescription = (isFaceIdAvailable: boolean, isTouchIdAvailable: boolean) => {
    if (isFaceIdAvailable && !isTouchIdAvailable) {
        return {
            title: msg`Enable Face ID unlock?`,
            description: msg`Use Face ID to unlock your app quickly and securely`
        };
    }

    if (isTouchIdAvailable && !isFaceIdAvailable) {
        return {
            title: msg`Enable Touch ID unlock?`,
            description: msg`Use Touch ID to unlock your app quickly and securely`
        };
    }

    return {
        title: msg`Enable biometric unlock?`,
        description: msg`Use Face ID or Touch ID to unlock your app quickly and securely`
    };
};

export const getPinFormMeta = (mode: PinSetupModeEnum, step: PinSetupStepEnum, isFaceIdAvailable: boolean, isTouchIdAvailable: boolean) => {
    if (mode === PinSetupModeEnum.DISABLE) {
        return {
            title: msg`Enter current PIN`,
            description: msg`Enter current PIN to disable protection`
        };
    }

    if (step === PinSetupStepEnum.VERIFY_OLD) {
        return {
            title: msg`Enter current PIN`,
            description: msg`Enter your ${PIN_LENGTH}-digit PIN`
        };
    }

    if (step === PinSetupStepEnum.CREATE) {
        return {
            title: mode === PinSetupModeEnum.CHANGE ? msg`Enter new PIN` : msg`Create a PIN`,
            description: msg`Enter a ${PIN_LENGTH}-digit PIN`
        };
    }

    if (step === PinSetupStepEnum.CONFIRM) {
        return {
            title: msg`Confirm PIN`,
            description: msg`Re-enter your PIN to confirm`
        };
    }

    return getBiometricTitleAndDescription(isFaceIdAvailable, isTouchIdAvailable);
};
