import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { Button } from '../../@generic/component/button/button';
import { LoadingOverlay } from '../../@generic/component/loading-overlay/loading-overlay';
import { PinForm } from '../../auth/components/pin-form/pin-form';
import { usePinAuthentication } from '../../auth/hook/use-pin-authentication.hook';

import { PinScreenSelector } from './pin-screen.selector';

export default function PinScreen() {
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

    const handleForgotPinPress = () => void router.push('/forgot-pin');

    return (
        <View className="flex-1 bg-primary-reverse">
            <View className="flex-1 px-6xl justify-center">
                <PinForm
                    title={title}
                    description={description}
                    currentInput={input}
                    error={error}
                    isLoading={isInputDisabled}
                    onDigitPress={addDigit}
                    onDeletePress={deleteDigit}
                    onScanPress={handleBiometricAuth}
                    canScan={canUseBiometric}
                    isFaceIdAvailable={isFaceIdAvailable}
                />

                <Button
                    testID={PinScreenSelector.ForgotPinButton}
                    variant="ghost"
                    content={t`Forgot PIN?`}
                    onPress={handleForgotPinPress}
                    className="mb-5xl"
                />

                {isLoading ? <LoadingOverlay /> : null}
            </View>
        </View>
    );
}
