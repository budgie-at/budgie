import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedListSwitchRow } from '../../../@generic/component/grouped-list-switch-row/grouped-list-switch-row';
import { useProcessingHaptic } from '../../../@generic/hook/use-processing-haptic.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useAuthContext } from '../../../auth/context/auth.context';
import { AuthService } from '../../../auth/service/auth.service';
import { ONBOARDING_STEP_ORDER } from '../../constant/onboarding-step-order.constant';
import { ONBOARDING_STEP_ROUTE } from '../../constant/onboarding-step-route.constant';
import { useOnboardingPinContext } from '../../context/onboarding-pin.context';
import { OnboardingFileLockEnum } from '../../enum/onboarding-file-lock.enum';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingFooterAction } from '../onboarding-footer-action/onboarding-footer-action';
import { OnboardingHoldToSealButton } from '../onboarding-hold-to-seal-button/onboarding-hold-to-seal-button';
import { OnboardingStepIntro } from '../onboarding-step-intro/onboarding-step-intro';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

import { OnboardingSealSelector } from './onboarding-seal.selector';

// eslint-disable-next-line max-lines-per-function, max-statements -- Layout/form component requires many lines
export const OnboardingSeal = () => {
    const { t } = useLingui();

    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [isSealing, setIsSealing] = useState(false);

    useProcessingHaptic(isSealing);

    const { pin } = useOnboardingPinContext();
    const { goBack } = useOnboardingNavigation();
    const { isSomeAvailable, isFaceIdAvailable } = useAuthContext();

    const handleBiometricChange = (isEnabled: boolean) => {
        if (isSealing) {
            return;
        }

        if (!isEnabled) {
            setIsBiometricEnabled(false);

            return;
        }

        appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(AuthService, authService => authService.authenticateWithBiometrics()).pipe(
                    Effect.tap(isAuthenticated => Effect.sync(() => void setIsBiometricEnabled(isAuthenticated)))
                )
            )
        );
    };

    const handleSeal = () => {
        if (!isNotEmptyString(pin)) {
            return;
        }

        setIsSealing(true);
        appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(AuthService, authService =>
                    authService.sealOnboarding(pin, isBiometricEnabled, ONBOARDING_STEP_ORDER.indexOf(OnboardingStepEnum.SEALED))
                ).pipe(
                    toastOnFailure(t`Could not seal the file`),
                    Effect.tapCause(() => Effect.sync(() => void setIsSealing(false)))
                )
            )
        );
    };

    if (!isNotEmptyString(pin)) {
        return <Redirect href={ONBOARDING_STEP_ROUTE[OnboardingStepEnum.PIN]} />;
    }

    const biometricLabel = isFaceIdAvailable ? t`Use Face ID` : Platform.select({ ios: t`Use Touch ID`, default: t`Use fingerprint` });
    const biometricIcon = isFaceIdAvailable ? UserIconNameEnum.ScanFace : UserIconNameEnum.Fingerprint;
    const biometricFooter = isSomeAvailable ? t`You’ll still need the PIN after a restart.` : null;
    const noResetSentence = t`If you forget it, nobody can open this file, including you and us.`;

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.SEAL}
            fileState={t`PINs match`}
            fileLock={OnboardingFileLockEnum.OPEN}
            footer={
                <>
                    <OnboardingHoldToSealButton
                        testID={OnboardingSealSelector.HoldButton}
                        label={t`Hold to seal with this PIN`}
                        confirmMessage={noResetSentence}
                        isDisabled={isSealing}
                        onComplete={handleSeal}
                    />
                    <OnboardingFooterAction
                        testID={OnboardingSealSelector.DifferentPinButton}
                        label={t`Choose a different PIN`}
                        isDisabled={isSealing}
                        onPress={goBack}
                    />
                </>
            }
        >
            <OnboardingStepIntro
                icon={UserIconNameEnum.KeyRound}
                title={t`There is no “forgot PIN”.`}
                description={t`We never see your PIN, and there’s no account to reset it through. ${noResetSentence}`}
            />

            <GroupedListSection footer={biometricFooter}>
                <GroupedListRow
                    left={<GroupedListIcon icon={UserIconNameEnum.NotebookPen} />}
                    title={t`Keep your PIN safe`}
                    subtitle={t`Write it down or keep it in a password manager.`}
                />

                {isSomeAvailable ? (
                    <GroupedListSwitchRow
                        left={<GroupedListIcon icon={biometricIcon} />}
                        title={biometricLabel}
                        subtitle=""
                        value={isBiometricEnabled}
                        switchTestID={OnboardingSealSelector.BiometricSwitch}
                        onChange={handleBiometricChange}
                    />
                ) : null}
            </GroupedListSection>
        </OnboardingStepLayout>
    );
};
