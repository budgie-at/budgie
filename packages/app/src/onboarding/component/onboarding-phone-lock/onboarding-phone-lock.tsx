import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { OnboardingFileLockEnum } from '../../enum/onboarding-file-lock.enum';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { useOnboardingReceiptRows } from '../../hook/use-onboarding-receipt-rows.hook';
import { OnboardingFooterAction } from '../onboarding-footer-action/onboarding-footer-action';
import { OnboardingReceiptSection } from '../onboarding-receipt-section/onboarding-receipt-section';
import { OnboardingStepIntro } from '../onboarding-step-intro/onboarding-step-intro';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

import { OnboardingPhoneLockSelector } from './onboarding-phone-lock.selector';

export const OnboardingPhoneLock = () => {
    const { t } = useLingui();
    const { goToStep, replaceWithStep } = useOnboardingNavigation();

    const handleContinuePress = () => void goToStep(OnboardingStepEnum.ACCOUNTS);
    const handleMakePinPress = () => void replaceWithStep(OnboardingStepEnum.PIN);

    const receiptRows = useOnboardingReceiptRows();

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.PHONE_LOCK}
            fileState={t`Phone lock`}
            fileLock={OnboardingFileLockEnum.PHONE}
            footer={
                <>
                    <PillButton
                        testID={OnboardingPhoneLockSelector.ContinueButton}
                        label={t`Continue without a PIN`}
                        onPress={handleContinuePress}
                    />
                    <OnboardingFooterAction
                        testID={OnboardingPhoneLockSelector.MakePinButton}
                        label={t`Make a PIN after all`}
                        onPress={handleMakePinPress}
                    />
                </>
            }
        >
            <OnboardingStepIntro
                icon={UserIconNameEnum.Smartphone}
                title={t`Your phone’s lock will be the only lock.`}
                description={t`Everything still stays on this device and nothing is uploaded. But anyone who can unlock your phone can open Budgie.`}
            />

            <OnboardingReceiptSection
                rows={receiptRows}
                footer={t`You can add a PIN any time in Settings. Budgie then encrypts the file with it.`}
            />
        </OnboardingStepLayout>
    );
};
