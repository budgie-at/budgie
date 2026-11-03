import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { OnboardingSealedMomentSelector } from '../onboarding-sealed-moment/onboarding-sealed-moment.selector';
import { OnboardingStepFooter } from '../onboarding-step-footer/onboarding-step-footer';

interface Props {
    readonly onContinue: EmptyFn;
}

export const OnboardingSealedActions = ({ onContinue }: Props) => {
    const { t } = useLingui();

    return (
        <OnboardingStepFooter>
            <PillButton testID={OnboardingSealedMomentSelector.ContinueButton} label={t`Continue`} onPress={onContinue} />
            <View className="min-h-[44px]" />
        </OnboardingStepFooter>
    );
};
