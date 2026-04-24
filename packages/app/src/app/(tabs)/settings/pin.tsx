import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { LoadingOverlay } from '../../../@generic/component/loading-overlay/loading-overlay';
import { FullPage } from '../../../@generic/component/page/full-page';
import { isEnumValue } from '../../../@generic/type-guard/is-enum-value.type-guard';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BiometricConfiguration } from '../../../auth/components/biometric-configuration/biometric-configuration';
import { PinForm } from '../../../auth/components/pin-form/pin-form';
import { useAuthContext } from '../../../auth/context/auth.context';
import { PinSetupModeEnum } from '../../../auth/enum/pin-setup-mode.enum';
import { PinSetupStepEnum } from '../../../auth/enum/pin-setup-step.enum';
import { usePinSetup } from '../../../auth/hook/use-pin-setup.hook';
import { getPinSetupMeta } from '../../../auth/util/get-pin-setup-meta.util';

export default function PinSetupScreen() {
    const { mode } = useLocalSearchParams<{ mode: PinSetupModeEnum }>();
    const { isFaceIdAvailable, isTouchIdAvailable } = useAuthContext();
    const { t } = useLingui();

    const { state, addDigit, deleteDigit, saveAndContinue } = usePinSetup({ mode });
    const { title, description } = getPinSetupMeta(state.mode, state.step, isFaceIdAvailable, isTouchIdAvailable);

    if (!isEnumValue(mode, PinSetupModeEnum)) {
        return <Redirect href="/settings" />;
    }

    const handleGoBack = () => void goBackOrReplace('/settings');

    const error = isDefined(state.error) ? t(state.error) : null;

    return (
        <FullPage>
            <GoBackButton onPress={handleGoBack} className="absolute left-[20px] top-[20px]" />

            <View className="flex-1 justify-center">
                {state.step === PinSetupStepEnum.BIOMETRIC ? (
                    <BiometricConfiguration onSubmit={saveAndContinue} />
                ) : (
                    <PinForm
                        error={error}
                        title={t(title)}
                        description={t(description)}
                        currentInput={state.input}
                        isLoading={state.isLoading}
                        onDigitPress={addDigit}
                        onDeletePress={deleteDigit}
                    />
                )}
            </View>

            {state.isLoading ? <LoadingOverlay /> : null}
        </FullPage>
    );
}
