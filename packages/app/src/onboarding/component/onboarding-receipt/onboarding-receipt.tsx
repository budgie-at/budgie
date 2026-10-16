import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { Button } from '../../../@generic/component/button/button';
import { DB_NAME } from '../../../@generic/drizzle/constant/db-name.constant';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingFileState } from '../../hook/use-onboarding-file-state.hook';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { useOnboardingReceiptRows } from '../../hook/use-onboarding-receipt-rows.hook';
import { OnboardingNote } from '../onboarding-note/onboarding-note';
import { OnboardingReceiptCard } from '../onboarding-receipt-card/onboarding-receipt-card';
import { OnboardingStepIntro } from '../onboarding-step-intro/onboarding-step-intro';
import { OnboardingStepLayout } from '../onboarding-step-layout/onboarding-step-layout';

import { OnboardingReceiptSelector } from './onboarding-receipt.selector';

export const OnboardingReceipt = () => {
    const { t } = useLingui();
    const { goToStep, completeOnboarding } = useOnboardingNavigation();
    const { state, isSealed } = useOnboardingFileState();
    const fileRows = useOnboardingReceiptRows();

    const handleChooseContentsPress = () => void goToStep(OnboardingStepEnum.ACCOUNTS);

    const receiptRows = [{ label: t`File`, value: DB_NAME }, { label: t`Lives on`, value: t`This phone` }, ...fileRows];

    return (
        <OnboardingStepLayout
            step={OnboardingStepEnum.SEALED}
            fileState={state}
            isFileSealed={isSealed}
            isBackVisible={false}
            footer={
                <>
                    <Button
                        testID={OnboardingReceiptSelector.ChooseContentsButton}
                        variant="cta"
                        content={t`Choose what goes inside`}
                        onPress={handleChooseContentsPress}
                    />
                    <Button
                        testID={OnboardingReceiptSelector.GoToBudgieButton}
                        variant="ghost"
                        content={t`Go straight to Budgie`}
                        onPress={completeOnboarding}
                    />
                </>
            }
        >
            <OnboardingStepIntro
                icon={UserIconNameEnum.ShieldCheck}
                iconVariant="positive"
                title={t`Only your PIN opens this file.`}
                description={t`This is where your data lives and who can read it. You can find it again in Settings › Privacy.`}
            />

            <OnboardingReceiptCard rows={receiptRows} />

            <OnboardingNote
                icon={UserIconNameEnum.Plane}
                variant="cyan"
                text={t`Try switching on Airplane Mode. Budgie works exactly the same.`}
            />
        </OnboardingStepLayout>
    );
};
