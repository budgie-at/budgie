import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { PinSetupModeEnum } from '../../../auth/enum/pin-setup-mode.enum';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';
import { OnboardingSuccessRow } from '../onboarding-success-row/onboarding-success-row';

import { OnboardingLockSelector } from './onboarding-lock.selector';

export const OnboardingLock = () => {
    const { t } = useLingui();
    const { goToNextStep } = useOnboardingNavigation();
    const isPinEnabled = useSetting('isPinEnabled');

    const handleSetPinPress = () => void router.push({ pathname: '/settings/pin', params: { mode: PinSetupModeEnum.CREATE } });
    const handlePrimary = () => void goToNextStep(OnboardingStepEnum.LOCK);

    const primaryLabel = isPinEnabled ? t`Continue` : t`Set a PIN`;
    const handlePrimaryPress = isPinEnabled ? handlePrimary : handleSetPinPress;

    const stepContent = isPinEnabled ? (
        <OnboardingSuccessRow label={t`App locked and encrypted`} testID={OnboardingLockSelector.SuccessRow} />
    ) : null;

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.LOCK}
            icon={UserIconNameEnum.Lock}
            title={t`Lock it down`}
            description={t`Your PIN unlocks the database itself — it is the encryption key. Without it the file is unreadable, even to us.`}
            primaryLabel={primaryLabel}
            onPrimary={handlePrimaryPress}
        >
            {stepContent}
        </OnboardingStepLayout>
    );
};
