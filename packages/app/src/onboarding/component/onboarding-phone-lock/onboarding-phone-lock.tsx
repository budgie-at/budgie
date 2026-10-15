import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { Button } from '../../../@generic/component/button/button';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingNote } from '../onboarding-note/onboarding-note';
import { OnboardingReceiptCard } from '../onboarding-receipt-card/onboarding-receipt-card';
import { OnboardingStepIntro } from '../onboarding-step-intro/onboarding-step-intro';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

import { OnboardingPhoneLockSelector } from './onboarding-phone-lock.selector';

export const OnboardingPhoneLock = () => {
    const { t } = useLingui();
    const { goToStep, replaceWithStep } = useOnboardingNavigation();

    const handleContinuePress = () => void goToStep(OnboardingStepEnum.ACCOUNTS);
    const handleMakePinPress = () => void replaceWithStep(OnboardingStepEnum.PIN);

    const receiptRows = [
        { label: t`Opens with`, value: t`This phone's lock` },
        { label: t`Copies elsewhere`, value: t`None` }
    ];

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.PHONE_LOCK}
            fileState={t`Phone lock only`}
            footer={
                <>
                    <Button
                        testID={OnboardingPhoneLockSelector.ContinueButton}
                        variant="cta"
                        content={t`Continue without a PIN`}
                        onPress={handleContinuePress}
                    />
                    <Button
                        testID={OnboardingPhoneLockSelector.MakePinButton}
                        variant="ghost"
                        content={t`Make a PIN after all`}
                        onPress={handleMakePinPress}
                    />
                </>
            }
        >
            <OnboardingStepIntro
                icon={UserIconNameEnum.Smartphone}
                title={t`Your phone's lock will be the only lock.`}
                description={t`Everything still stays on this device and nothing is uploaded. But anyone who can unlock your phone can open Budgie.`}
            />

            <OnboardingReceiptCard rows={receiptRows} />

            <OnboardingNote
                icon={UserIconNameEnum.KeyRound}
                text={t`You can add a PIN any time in Settings. Budgie re-encrypts the file with it then.`}
            />
        </OnboardingStepLayout>
    );
};
