import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { LoadingOverlay } from '../../../@generic/component/loading-overlay/loading-overlay';
import { FullPage } from '../../../@generic/component/page/full-page';
import { useIsSlowWork } from '../../../@generic/hook/use-is-slow-work.hook';
import { isEnumValue } from '../../../@generic/type-guard/is-enum-value.type-guard';
import { BiometricConfiguration } from '../../../auth/components/biometric-configuration/biometric-configuration';
import { PinForm } from '../../../auth/components/pin-form/pin-form';
import { useAuthContext } from '../../../auth/context/auth.context';
import { PinSetupModeEnum } from '../../../auth/enum/pin-setup-mode.enum';
import { PinSetupStepEnum } from '../../../auth/enum/pin-setup-step.enum';
import { usePinSetup } from '../../../auth/hook/use-pin-setup.hook';
import { getPinSetupMeta } from '../../../auth/utils/get-pin-setup-meta.util';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';

export default function PinSetupScreen() {
    const { mode } = useLocalSearchParams<{ mode: PinSetupModeEnum }>();
    const { isFaceIdAvailable, isTouchIdAvailable } = useAuthContext();
    const { t } = useLingui();

    const { state, addDigit, deleteDigit, saveAndContinue } = usePinSetup({ mode });
    const { title, description } = getPinSetupMeta(state.mode, state.step, isFaceIdAvailable, isTouchIdAvailable);
    const isSlowWork = useIsSlowWork(state.isLoading);

    if (!isEnumValue(mode, PinSetupModeEnum)) {
        return <Redirect href="/settings" />;
    }

    return (
        <FullPage>
            <View className="flex-1 justify-center">
                {state.step === PinSetupStepEnum.BIOMETRIC ? (
                    <BiometricConfiguration isLoading={state.isLoading} onSubmit={saveAndContinue} />
                ) : (
                    <PinForm
                        error={state.error}
                        title={t(title)}
                        description={t(description)}
                        currentInput={state.input}
                        isLoading={state.isInputDisabled}
                        onDigitPress={addDigit}
                        onDeletePress={deleteDigit}
                    />
                )}
            </View>

            <GoBackButton onPress={goBackToSettings} className="absolute left-[20px] top-[20px]" />

            {isSlowWork ? <LoadingOverlay /> : null}
        </FullPage>
    );
}
