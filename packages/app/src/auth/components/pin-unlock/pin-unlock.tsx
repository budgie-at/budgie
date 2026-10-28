import { useLingui } from '@lingui/react/macro';
import React from 'react';
import { View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { LoadingOverlay } from '../../../@generic/component/loading-overlay/loading-overlay';
import { usePinAuthentication } from '../../hook/use-pin-authentication.hook';
import { PinFormBiometricButton } from '../pin-form-biometric-button/pin-form-biometric-button';
import { PinForm } from '../pin-form/pin-form';

import { PinUnlockSelector } from './pin-unlock.selector';

interface Props {
    readonly onForgotPin: () => void;
}

export const PinUnlock = ({ onForgotPin }: Props) => {
    const { t } = useLingui();
    const {
        addDigit,
        canUseBiometric,
        deleteDigit,
        description,
        error,
        handleBiometricAuth,
        input,
        isFaceIdAvailable,
        isInputDisabled,
        isLoading,
        title
    } = usePinAuthentication();

    return (
        <View className="flex-1 bg-primary-reverse pt-safe pb-safe">
            <View className="flex-1 px-6xl justify-center">
                <PinForm
                    title={title}
                    description={description}
                    currentInput={input}
                    error={error}
                    isLoading={isInputDisabled}
                    onDigitPress={addDigit}
                    onDeletePress={deleteDigit}
                >
                    <PinFormBiometricButton
                        isFaceIdAvailable={isFaceIdAvailable}
                        {...(canUseBiometric && { onPress: handleBiometricAuth })}
                    />
                </PinForm>

                <Button
                    testID={PinUnlockSelector.ForgotPinButton}
                    variant="ghost"
                    content={t`Forgot PIN?`}
                    onPress={onForgotPin}
                    className="mb-5xl"
                />

                {isLoading ? <LoadingOverlay /> : null}
            </View>
        </View>
    );
};
