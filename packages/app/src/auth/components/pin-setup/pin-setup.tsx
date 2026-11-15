import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { FullPage } from '../../../@generic/component/page/full-page';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';
import { useAuthContext } from '../../context/auth.context';
import { PinSetupModeEnum } from '../../enum/pin-setup-mode.enum';
import { PinSetupStepEnum } from '../../enum/pin-setup-step.enum';
import { usePinSetup } from '../../hook/use-pin-setup.hook';
import { getPinFormStatus } from '../../utils/get-pin-form-status.util';
import { getPinSetupMeta } from '../../utils/get-pin-setup-meta.util';
import { BiometricConfiguration } from '../biometric-configuration/biometric-configuration';
import { PinForgottenWarning } from '../pin-forgotten-warning/pin-forgotten-warning';
import { PinFormHeader } from '../pin-form-header/pin-form-header';
import { PinForm } from '../pin-form/pin-form';
import { PinRestartButton } from '../pin-restart-button/pin-restart-button';
import { PinSealingState } from '../pin-sealing-state/pin-sealing-state';
import { PinStepIndicator } from '../pin-step-indicator/pin-step-indicator';

const getSetupSteps = (mode: PinSetupModeEnum, isSomeAvailable: boolean): PinSetupStepEnum[] => {
    if (mode === PinSetupModeEnum.CHANGE) {
        return [PinSetupStepEnum.VERIFY_OLD, PinSetupStepEnum.CREATE, PinSetupStepEnum.CONFIRM];
    }

    if (mode === PinSetupModeEnum.CREATE) {
        const pinSteps = [PinSetupStepEnum.CREATE, PinSetupStepEnum.CONFIRM];

        return isSomeAvailable ? [...pinSteps, PinSetupStepEnum.BIOMETRIC] : pinSteps;
    }

    return [];
};

interface Props {
    readonly mode: PinSetupModeEnum;
}

export const PinSetup = ({ mode }: Props) => {
    const { biometricKind, isSomeAvailable } = useAuthContext();
    const { t } = useLingui();

    const { state, addDigit, deleteDigit, restartNewPin, saveAndContinue } = usePinSetup(mode);
    const { title, description, icon, iconVariant } = getPinSetupMeta(mode, state.step, biometricKind);

    const steps = getSetupSteps(mode, isSomeAvailable);
    const currentStepIndex = steps.indexOf(state.step);
    const hasSteps = steps.length > 1;
    const isBiometricStep = state.step === PinSetupStepEnum.BIOMETRIC;
    const isChoosingNewPin = state.step === PinSetupStepEnum.CREATE;
    const isConfirmingNewPin = state.step === PinSetupStepEnum.CONFIRM;
    const handleGoBack = isConfirmingNewPin ? restartNewPin : goBackToSettings;
    const restartNewPinButton = isConfirmingNewPin ? <PinRestartButton onPress={restartNewPin} disabled={state.isLoading} /> : null;
    const pinFormStatus = getPinFormStatus(state.isLoading, state.isInputDisabled, state.isAccepted);
    const pinFormFooter = isChoosingNewPin ? <PinForgottenWarning /> : restartNewPinButton;

    return (
        <FullPage contentClassName="px-0">
            <View className="h-[52px] flex-row items-center justify-between px-lg">
                {isBiometricStep ? <View className="size-[40px]" /> : <GoBackButton onPress={handleGoBack} disabled={state.isLoading} />}

                {hasSteps ? <PinStepIndicator total={steps.length} current={currentStepIndex} /> : null}

                <View className="size-[40px]" />
            </View>

            <View className="flex-1 px-5xl" accessibilityElementsHidden={state.isSealing}>
                {isBiometricStep ? (
                    <BiometricConfiguration isLoading={state.isLoading} error={state.error} onSubmit={saveAndContinue} />
                ) : (
                    <PinForm
                        header={<PinFormHeader title={t(title)} description={t(description)} icon={icon} iconVariant={iconVariant} />}
                        error={state.error}
                        currentInput={state.input}
                        status={pinFormStatus}
                        onDigitPress={addDigit}
                        onDeletePress={deleteDigit}
                        footer={pinFormFooter}
                    />
                )}
            </View>

            {state.isSealing ? <PinSealingState mode={mode} /> : null}
        </FullPage>
    );
};
