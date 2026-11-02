import { useLingui } from '@lingui/react/macro';
import { useReducer } from 'react';
import { View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { FullPage } from '../../../@generic/component/page/full-page';
import { PinForgottenWarning } from '../../../auth/components/pin-forgotten-warning/pin-forgotten-warning';
import { PinFormHeader } from '../../../auth/components/pin-form-header/pin-form-header';
import { PinForm } from '../../../auth/components/pin-form/pin-form';
import { PinRestartButton } from '../../../auth/components/pin-restart-button/pin-restart-button';
import { PIN_LENGTH } from '../../../auth/constant/pin-length.constant';
import { PinFormStatusEnum } from '../../../auth/enum/pin-form-status.enum';
import { useOnboardingPinContext } from '../../context/onboarding-pin.context';
import { OnboardingPinActionTypeEnum } from '../../enum/onboarding-pin-action-type.enum';
import { OnboardingPinPhaseEnum } from '../../enum/onboarding-pin-phase.enum';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { onboardingPinReducer } from '../../utils/onboarding-pin-reducer.util';
import { OnboardingStepHeader } from '../onboarding-step-header/onboarding-step-header';

import { OnboardingPinSelector } from './onboarding-pin.selector';

// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
export const OnboardingPin = () => {
    const { t } = useLingui();

    const [{ phase, input, firstPin }, dispatch] = useReducer(onboardingPinReducer, {
        phase: OnboardingPinPhaseEnum.CREATE,
        input: '',
        firstPin: ''
    });

    const { setPin } = useOnboardingPinContext();
    const { goToStep, goBack } = useOnboardingNavigation();

    const restartEntry = (nextPhase: OnboardingPinPhaseEnum, nextFirstPin: string) => {
        dispatch({ type: OnboardingPinActionTypeEnum.ENTRY_RESTARTED, phase: nextPhase, firstPin: nextFirstPin });
    };

    const submit = (pin: string) => {
        if (phase === OnboardingPinPhaseEnum.CREATE) {
            restartEntry(OnboardingPinPhaseEnum.CONFIRM, pin);

            return;
        }

        if (pin !== firstPin) {
            restartEntry(OnboardingPinPhaseEnum.MISMATCH, firstPin);

            return;
        }

        setPin(pin);
        restartEntry(OnboardingPinPhaseEnum.CREATE, '');
        goToStep(OnboardingStepEnum.SEAL);
    };

    const handleDigitPress = (digit: string) => {
        if (input.length >= PIN_LENGTH) {
            return;
        }

        const nextInput = input + digit;
        dispatch({ type: OnboardingPinActionTypeEnum.DIGIT_ENTERED, digit });

        if (nextInput.length === PIN_LENGTH) {
            submit(nextInput);
        }
    };

    const handleDeletePress = () => void dispatch({ type: OnboardingPinActionTypeEnum.DIGIT_DELETED });
    const handleChooseDifferentPinPress = () => void restartEntry(OnboardingPinPhaseEnum.CREATE, '');

    const isMismatch = phase === OnboardingPinPhaseEnum.MISMATCH;
    const isConfirming = phase !== OnboardingPinPhaseEnum.CREATE;
    const fileState = isMismatch ? t`Didn't match` : t`Waiting for a key`;
    const title = isConfirming ? t`Confirm your PIN` : t`Choose a PIN`;
    const description = isConfirming
        ? t`Enter the same PIN again.`
        : t`It encrypts everything in Budgie. Pick one you'll remember but others won't guess.`;
    const error = isMismatch && !isNotEmptyString(input) ? t`PINs don't match. Try again.` : null;
    const handleBack = isConfirming ? handleChooseDifferentPinPress : goBack;
    const pinFormFooter = isConfirming ? <PinRestartButton onPress={handleChooseDifferentPinPress} /> : <PinForgottenWarning />;

    return (
        <FullPage
            testID={OnboardingPinSelector.Root}
            className="bg-background"
            header={<OnboardingStepHeader fileState={fileState} isFileSealed={false} isBackVisible onBack={handleBack} />}
        >
            <View className="flex-1 px-xl">
                <PinForm
                    header={<PinFormHeader title={title} description={description} />}
                    currentInput={input}
                    error={error}
                    status={PinFormStatusEnum.READY}
                    onDigitPress={handleDigitPress}
                    onDeletePress={handleDeletePress}
                    footer={pinFormFooter}
                />
            </View>
        </FullPage>
    );
};
