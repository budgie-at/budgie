import { useLingui } from '@lingui/react/macro';
import { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';
import { useReducer } from 'react';
import { View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { FullPage } from '../../../@generic/component/page/full-page';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { PinForm } from '../../../auth/components/pin-form/pin-form';
import { PIN_LENGTH } from '../../../auth/constant/pin-length.constant';
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
    const [hapticNotification, hapticImpact] = useVibration();

    const restartEntry = (nextPhase: OnboardingPinPhaseEnum, nextFirstPin: string) => {
        dispatch({ type: OnboardingPinActionTypeEnum.ENTRY_RESTARTED, phase: nextPhase, firstPin: nextFirstPin });
    };

    const submit = (pin: string) => {
        if (phase !== OnboardingPinPhaseEnum.CONFIRM) {
            restartEntry(OnboardingPinPhaseEnum.CONFIRM, pin);

            return;
        }

        if (pin !== firstPin) {
            hapticNotification(NotificationFeedbackType.Error);
            restartEntry(OnboardingPinPhaseEnum.MISMATCH, '');

            return;
        }

        hapticNotification(NotificationFeedbackType.Success);
        setPin(pin);
        restartEntry(OnboardingPinPhaseEnum.CREATE, '');
        goToStep(OnboardingStepEnum.SEAL);
    };

    const handleDigitPress = (digit: string) => {
        if (input.length >= PIN_LENGTH) {
            return;
        }

        hapticImpact(ImpactFeedbackStyle.Light);
        const nextInput = input + digit;
        dispatch({ type: OnboardingPinActionTypeEnum.DIGIT_ENTERED, digit });

        if (nextInput.length === PIN_LENGTH) {
            submit(nextInput);
        }
    };

    const handleDeletePress = () => void dispatch({ type: OnboardingPinActionTypeEnum.DIGIT_DELETED });
    const handleContinueWithoutPinPress = () => void goToStep(OnboardingStepEnum.PHONE_LOCK);

    const isMismatch = phase === OnboardingPinPhaseEnum.MISMATCH;
    const isConfirm = phase === OnboardingPinPhaseEnum.CONFIRM;
    const fileState = isMismatch ? t`Didn't match` : t`Waiting for a key`;
    const confirmTitle = isConfirm ? t`Enter it once more` : t`Choose a PIN`;
    const title = isMismatch ? t`Those didn't match` : confirmTitle;
    const confirmDescription = isConfirm
        ? t`Type the same PIN again to make sure it's the one you meant.`
        : t`It will encrypt everything you put in Budgie. Pick one you'll remember but others won't guess.`;
    const description = isMismatch
        ? t`Enter your new PIN again from the start. Take your time: this is the one you'll need to remember.`
        : confirmDescription;
    const error = isMismatch ? t`Start again with your new PIN` : null;

    return (
        <FullPage
            testID={OnboardingPinSelector.Root}
            className="bg-background"
            header={<OnboardingStepHeader fileState={fileState} isFileSealed={false} isBackVisible onBack={goBack} />}
        >
            <View className="flex-1 px-xl">
                <PinForm
                    title={title}
                    description={description}
                    currentInput={input}
                    error={error}
                    isLoading={false}
                    onDigitPress={handleDigitPress}
                    onDeletePress={handleDeletePress}
                />
            </View>

            {isMismatch ? (
                <Button
                    testID={OnboardingPinSelector.ContinueWithoutPinButton}
                    variant="ghost"
                    content={t`Continue without a PIN`}
                    onPress={handleContinueWithoutPinPress}
                    className="mb-5xl"
                />
            ) : null}
        </FullPage>
    );
};
