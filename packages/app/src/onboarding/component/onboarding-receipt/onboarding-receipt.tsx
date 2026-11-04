import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingFileState } from '../../hook/use-onboarding-file-state.hook';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { useOnboardingReceiptRows } from '../../hook/use-onboarding-receipt-rows.hook';
import { OnboardingFooterAction } from '../onboarding-footer-action/onboarding-footer-action';
import { OnboardingReceiptSection } from '../onboarding-receipt-section/onboarding-receipt-section';
import { OnboardingStepIntro } from '../onboarding-step-intro/onboarding-step-intro';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

import { OnboardingReceiptSelector } from './onboarding-receipt.selector';

export const OnboardingReceipt = () => {
    const { t } = useLingui();
    const { goToStep, completeOnboarding } = useOnboardingNavigation();
    const { state, lock } = useOnboardingFileState();
    const receiptRows = useOnboardingReceiptRows();

    const handleChooseContentsPress = () => void goToStep(OnboardingStepEnum.ACCOUNTS);

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.SEALED}
            fileState={state}
            fileLock={lock}
            footer={
                <>
                    <PillButton
                        testID={OnboardingReceiptSelector.ChooseContentsButton}
                        label={t`Choose what goes inside`}
                        onPress={handleChooseContentsPress}
                    />
                    <OnboardingFooterAction
                        testID={OnboardingReceiptSelector.GoToBudgieButton}
                        label={t`Go straight to Budgie`}
                        onPress={completeOnboarding}
                    />
                </>
            }
        >
            <OnboardingStepIntro
                icon={UserIconNameEnum.ShieldCheck}
                title={t`Your file. Your PIN.`}
                description={t`This is where your data lives and who can read it. You can find it again in Settings › Your data.`}
            />

            <OnboardingReceiptSection rows={receiptRows} footer={t`Try switching on Airplane Mode. Budgie works exactly the same.`} />
        </OnboardingStepLayout>
    );
};
