import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { usePinAuthentication } from '../../hook/use-pin-authentication.hook';
import { getPinFormStatus } from '../../utils/get-pin-form-status.util';
import { PinFormBiometricButton } from '../pin-form-biometric-button/pin-form-biometric-button';
import { PinFormHeader } from '../pin-form-header/pin-form-header';
import { PinForm } from '../pin-form/pin-form';

import { PinUnlockSelector } from './pin-unlock.selector';

interface Props {
    readonly onForgotPin: () => void;
}

export const PinUnlock = ({ onForgotPin }: Props) => {
    const { t } = useLingui();
    const { addDigit, canUseBiometric, deleteDigit, error, handleBiometricAuth, input, isFaceIdAvailable, isInputDisabled, isLoading } =
        usePinAuthentication();

    const biometricDescription = isFaceIdAvailable ? t`Or unlock with Face ID.` : t`Or unlock with Touch ID.`;
    const description = canUseBiometric ? biometricDescription : t`Your data is sealed. Only your PIN opens it.`;
    const status = getPinFormStatus(isLoading, isInputDisabled);

    return (
        <View className="flex-1 bg-primary-reverse pt-safe pb-safe px-5xl">
            <PinForm
                header={<PinFormHeader title={t`Enter your PIN`} description={description} />}
                currentInput={input}
                error={error}
                status={status}
                onDigitPress={addDigit}
                onDeletePress={deleteDigit}
                footer={
                    <Button
                        testID={PinUnlockSelector.ForgotPinButton}
                        variant="ghost"
                        content={t`Forgot PIN?`}
                        onPress={onForgotPin}
                        className="border-0 bg-transparent px-5xl min-h-[44px]"
                    />
                }
            >
                <PinFormBiometricButton isFaceIdAvailable={isFaceIdAvailable} {...(canUseBiometric && { onPress: handleBiometricAuth })} />
            </PinForm>
        </View>
    );
};
