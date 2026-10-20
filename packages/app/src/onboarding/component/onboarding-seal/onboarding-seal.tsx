import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';
import { LoadingOverlay } from '../../../@generic/component/loading-overlay/loading-overlay';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { showErrorToast } from '../../../@generic/utils/show-error-toast/show-error-toast';
import { useAuthContext } from '../../../auth/context/auth.context';
import { AuthService } from '../../../auth/service/auth.service';
import { ONBOARDING_STEP_ORDER } from '../../constant/onboarding-step-order.constant';
import { ONBOARDING_STEP_ROUTE } from '../../constant/onboarding-step-route.constant';
import { useOnboardingPinContext } from '../../context/onboarding-pin.context';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingHoldToSealButton } from '../onboarding-hold-to-seal-button/onboarding-hold-to-seal-button';
import { OnboardingNote } from '../onboarding-note/onboarding-note';
import { OnboardingStepIntro } from '../onboarding-step-intro/onboarding-step-intro';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

import { OnboardingSealSelector } from './onboarding-seal.selector';

// eslint-disable-next-line max-lines-per-function -- Layout/form component requires many lines
export const OnboardingSeal = () => {
    const { t } = useLingui();

    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [isSealing, setIsSealing] = useState(false);

    const { pin } = useOnboardingPinContext();
    const { goBack } = useOnboardingNavigation();
    const { isSomeAvailable, isFaceIdAvailable } = useAuthContext();

    const handleBiometricChange = (isEnabled: boolean) => {
        if (!isEnabled) {
            setIsBiometricEnabled(false);

            return;
        }

        void appRuntime
            .runPromise(Effect.flatMap(AuthService, authService => authService.authenticateWithBiometrics()))
            .then(setIsBiometricEnabled);
    };

    const handleSeal = () => {
        if (!isNotEmptyString(pin)) {
            return;
        }

        setIsSealing(true);
        appRuntime
            .runPromise(
                Effect.flatMap(AuthService, authService =>
                    authService.sealOnboarding(pin, isBiometricEnabled, ONBOARDING_STEP_ORDER.indexOf(OnboardingStepEnum.SEALED))
                )
            )
            .catch((error: unknown) => {
                setIsSealing(false);
                showErrorToast(t`Could not seal the file`, getErrorMessage(error));
            });
    };

    if (!isNotEmptyString(pin)) {
        return <Redirect href={ONBOARDING_STEP_ROUTE[OnboardingStepEnum.PIN]} />;
    }

    const biometricLabel = isFaceIdAvailable ? t`Face ID day to day` : t`Fingerprint day to day`;
    const biometricIcon = isFaceIdAvailable ? UserIconNameEnum.ScanFace : UserIconNameEnum.Fingerprint;
    const noResetSentence = t`If you forget it, nobody can open this file, including you and us.`;

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.SEAL}
            fileState={t`PINs match`}
            footer={
                <>
                    <OnboardingHoldToSealButton
                        testID={OnboardingSealSelector.HoldButton}
                        label={t`Hold to seal with this PIN`}
                        confirmMessage={noResetSentence}
                        isDisabled={isSealing}
                        onComplete={handleSeal}
                    />
                    <Button
                        testID={OnboardingSealSelector.DifferentPinButton}
                        variant="ghost"
                        content={t`Choose a different PIN`}
                        disabled={isSealing}
                        onPress={goBack}
                    />
                </>
            }
        >
            <OnboardingStepIntro
                icon={UserIconNameEnum.KeyRound}
                iconVariant="warning"
                title={t`There is no "forgot PIN".`}
                description={t`We never see your PIN, and there's no account to reset it through. ${noResetSentence}`}
            />

            <OnboardingNote
                icon={UserIconNameEnum.NotebookPen}
                variant="warning"
                text={t`Write it on paper and keep it somewhere safe. The only other way back is a backup you export yourself.`}
            />

            {isSomeAvailable ? (
                <Card variant="secondary" size="md" className="flex-row items-center gap-x-lg">
                    <Icon icon={biometricIcon} size={20} className="text-primary" />
                    <View className="flex-1">
                        <Text className="text-primary text-sm font-semibold">{biometricLabel}</Text>
                        <Text className="text-secondary-foreground text-xs">
                            <Trans>You&apos;ll still need the PIN after a restart.</Trans>
                        </Text>
                    </View>
                    <ThemedSwitch
                        testID={OnboardingSealSelector.BiometricSwitch}
                        value={isBiometricEnabled}
                        onValueChange={handleBiometricChange}
                        disabled={isSealing}
                    />
                </Card>
            ) : null}

            {isSealing ? <LoadingOverlay /> : null}
        </OnboardingStepLayout>
    );
};
