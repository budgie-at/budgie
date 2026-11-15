import { UserIconNameEnum, logAndContinue } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Redirect } from 'expo-router';
import { useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedListSwitchRow } from '../../../@generic/component/grouped-list-switch-row/grouped-list-switch-row';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { BIOMETRIC_KIND_ICON } from '../../../auth/constant/biometric-kind-icon.constant';
import { useAuthContext } from '../../../auth/context/auth.context';
import { BiometricKindEnum } from '../../../auth/enum/biometric-kind.enum';
import { useBiometricEnableLabel } from '../../../auth/hook/use-biometric-enable-label.hook';
import { AuthService } from '../../../auth/service/auth.service';
import { ONBOARDING_STEP_ORDER } from '../../constant/onboarding-step-order.constant';
import { ONBOARDING_STEP_ROUTE } from '../../constant/onboarding-step-route.constant';
import { useOnboardingPinContext } from '../../context/onboarding-pin.context';
import { OnboardingFileLockEnum } from '../../enum/onboarding-file-lock.enum';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingSealFooter } from '../onboarding-seal-footer/onboarding-seal-footer';
import { OnboardingStepIntro } from '../onboarding-step-intro/onboarding-step-intro';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

import { OnboardingSealSelector } from './onboarding-seal.selector';

export const OnboardingSeal = () => {
    const { t } = useLingui();

    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [isSealing, setIsSealing] = useState(false);

    const { pin } = useOnboardingPinContext();
    const { goBack } = useOnboardingNavigation();
    const { isSomeAvailable, biometricKind } = useAuthContext();
    const biometricLabel = useBiometricEnableLabel();

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

    const biometricIcon = BIOMETRIC_KIND_ICON[biometricKind ?? BiometricKindEnum.BIOMETRICS];
    const biometricFooter = isSomeAvailable ? t`You’ll still need the PIN after a restart.` : null;
    const noResetSentence = t`If you forget it, nobody can open this file, including you and us.`;

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.SEAL}
            fileState={t`PINs match`}
            fileLock={OnboardingFileLockEnum.OPEN}
            footer={<OnboardingSealFooter isSealing={isSealing} onSeal={handleSeal} onBack={goBack} />}
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
