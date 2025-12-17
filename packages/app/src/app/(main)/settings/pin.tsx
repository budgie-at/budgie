import { useLingui } from '@lingui/react/macro';
import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { FullPage } from '../../../@generic/components/page/full-page';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { isEnumValue } from '../../../@generic/type-guard/is-enum-value.type-guard';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { BiometricConfiguration } from '../../../auth/components/biometric-configuration/biometric-configuration';
import { PinForm } from '../../../auth/components/pin-form/pin-form';
import { PinSetupModeEnum } from '../../../auth/enum/pin-setup-mode.enum';
import { PinSetupStepEnum } from '../../../auth/enum/pin-setup-step.enum';
import { useBiometricAvailability } from '../../../auth/hook/use-biometric-availability.hook';
import { usePinSetup } from '../../../auth/hook/use-pin-setup.hook';
import { getPinFormMeta } from '../../../auth/util/get-pin-form-meta.util';
import { updateSettingsMutation } from '../../../settings/mutation/update-settings.mutation';

export default function PinSetupScreen() {
    const { mode } = useLocalSearchParams<{ mode: PinSetupModeEnum }>();
    const { isFaceIdAvailable, isTouchIdAvailable } = useBiometricAvailability();
    const { i18n } = useLingui();

    const { state, addDigit, deleteDigit, saveAndContinue } = usePinSetup({
        mode,
        onSuccess: () => {
            void updateSettingsMutation({ isPinEnabled: mode !== PinSetupModeEnum.DISABLE });
            void goBackOrReplace('/settings');
        }
    });
    const { title, description } = getPinFormMeta(state.mode, state.step, isFaceIdAvailable, isTouchIdAvailable);

    if (!isEnumValue(mode, PinSetupModeEnum)) {
        return <Redirect href="/settings" />;
    }

    const handleGoBack = () => void goBackOrReplace('/settings');

    const error = isDefined(state.error) ? i18n.t(state.error) : null;

    return (
        <FullPage>
            <View className="flex-1">
                <HapticPressable onPress={handleGoBack}>
                    <Icon icon={ICONS.ChevronLeft} className="text-primary" size={28} />
                </HapticPressable>

                <View className="flex-1 justify-center">
                    {state.step === PinSetupStepEnum.BIOMETRIC ? (
                        <BiometricConfiguration onSubmit={saveAndContinue} />
                    ) : (
                        <PinForm
                            error={error}
                            title={i18n.t(title)}
                            description={i18n.t(description)}
                            currentInput={state.input}
                            isLoading={state.isLoading}
                            onDigitPress={addDigit}
                            onDeletePress={deleteDigit}
                        />
                    )}
                </View>

                {state.isLoading && state.step !== PinSetupStepEnum.BIOMETRIC && (
                    <View className="absolute inset-0 bg-primary-reverse/80 justify-center items-center">
                        <ActivityIndicator size="large" color="var(--color-primary)" />
                    </View>
                )}
            </View>
        </FullPage>
    );
}
