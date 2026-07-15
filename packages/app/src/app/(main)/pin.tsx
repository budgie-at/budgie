import React from 'react';
import { View } from 'react-native';

import { LoadingOverlay } from '../../@generic/component/loading-overlay/loading-overlay';
import { PinForm } from '../../auth/components/pin-form/pin-form';
import { usePinAuthentication } from '../../auth/hook/use-pin-authentication.hook';

export default function PinScreen() {
    const { addDigit, canUseBiometric, deleteDigit, description, error, handleBiometricAuth, input, isLoading, title } =
        usePinAuthentication();

    return (
        <View className="flex-1 bg-primary-reverse">
            <View className="flex-1 px-6xl justify-center">
                <PinForm
                    title={title}
                    description={description}
                    currentInput={input}
                    error={error}
                    isLoading={isLoading}
                    onDigitPress={addDigit}
                    onDeletePress={deleteDigit}
                    onScanPress={handleBiometricAuth}
                    canScan={canUseBiometric}
                />

                {isLoading ? <LoadingOverlay /> : null}
            </View>
        </View>
    );
}
