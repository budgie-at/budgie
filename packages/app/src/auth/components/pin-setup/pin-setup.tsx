import { UserIconNameEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
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

const SEALING_COPY = {
    [PinSetupModeEnum.CREATE]: {
        title: msg`Encrypting your data`,
        description: msg`Keep Budgie open. It restarts when finished.`,
        icon: UserIconNameEnum.LockKeyhole,
        iconVariant: 'positive' as const
    },
    [PinSetupModeEnum.CHANGE]: {
        title: msg`Updating your PIN`,
        description: msg`Re-encrypting your data. Keep Budgie open, it restarts when finished.`,
        icon: UserIconNameEnum.LockKeyhole,
        iconVariant: 'positive' as const
    },
    [PinSetupModeEnum.DISABLE]: {
        title: msg`Turning off app lock`,
        description: msg`Decrypting your data. Keep Budgie open, it restarts when finished.`,
        icon: UserIconNameEnum.LockKeyholeOpen,
        iconVariant: 'secondary' as const
    }
};

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

// eslint-disable-next-line max-statements -- Setup screen orchestrates steps, biometric offer and sealing state
export const PinSetup = ({ mode }: Props) => {
    const { isFaceIdAvailable, isTouchIdAvailable, isSomeAvailable } = useAuthContext();
    const { t } = useLingui();

    const { state, addDigit, deleteDigit, restartNewPin, saveAndContinue } = usePinSetup({ mode });
    const { title, description, icon, iconVariant } = getPinSetupMeta(state.mode, state.step, isFaceIdAvailable, isTouchIdAvailable);

    const steps = getSetupSteps(mode, isSomeAvailable);
    const currentStepIndex = steps.indexOf(state.step);
    const hasSteps = steps.length > 1;
    const enableBiometricLabel = isFaceIdAvailable ? t`Use Face ID` : t`Use Touch ID`;
    const sealingCopy = SEALING_COPY[mode];
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
                    <BiometricConfiguration
                        title={t(title)}
                        description={t(description)}
                        icon={icon}
                        iconVariant={iconVariant}
                        enableLabel={enableBiometricLabel}
                        isLoading={state.isLoading}
                        error={state.error}
                        onSubmit={saveAndContinue}
                    />
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

            {state.isSealing ? (
                <PinSealingState
                    title={t(sealingCopy.title)}
                    description={t(sealingCopy.description)}
                    icon={sealingCopy.icon}
                    iconVariant={sealingCopy.iconVariant}
                />
            ) : null}
        </FullPage>
    );
};
