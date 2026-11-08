import { useLingui } from '@lingui/react/macro';

import { useProcessingHaptic } from '../../../@generic/hook/use-processing-haptic.hook';
import { OnboardingFooterAction } from '../onboarding-footer-action/onboarding-footer-action';
import { OnboardingHoldToSealButton } from '../onboarding-hold-to-seal-button/onboarding-hold-to-seal-button';
import { OnboardingSealSelector } from '../onboarding-seal/onboarding-seal.selector';

interface Props {
    readonly isSealing: boolean;
    readonly onSeal: () => void;
    readonly onBack: () => void;
}

export const OnboardingSealFooter = ({ isSealing, onSeal, onBack }: Props) => {
    const { t } = useLingui();
    useProcessingHaptic(isSealing);

    return (
        <>
            <OnboardingHoldToSealButton
                testID={OnboardingSealSelector.HoldButton}
                label={t`Hold to seal with this PIN`}
                isDisabled={isSealing}
                onComplete={onSeal}
            />
            <OnboardingFooterAction
                testID={OnboardingSealSelector.DifferentPinButton}
                label={t`Choose a different PIN`}
                isDisabled={isSealing}
                onPress={onBack}
            />
        </>
    );
};
