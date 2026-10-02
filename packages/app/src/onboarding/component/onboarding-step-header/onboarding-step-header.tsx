import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { ONBOARDING_STEP_ORDER } from '../../constant/onboarding-step-order.constant';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { OnboardingProgressBar } from '../onboarding-progress-bar/onboarding-progress-bar';
import { OnboardingStepLayoutSelector } from '../onboarding-step-layout/onboarding-step-layout.selector';

const BACK_ICON_SIZE = 24;

interface Props {
    readonly step: OnboardingStepEnum;
    readonly onBack: EmptyFn;
    readonly onSkip: EmptyFn;
}

export const OnboardingStepHeader = ({ step, onBack, onSkip }: Props) => {
    const isBackVisible = ONBOARDING_STEP_ORDER.indexOf(step) > 0;
    const isSkipVisible = step !== OnboardingStepEnum.WELCOME && step !== OnboardingStepEnum.DONE;

    return (
        <View className="px-5xl">
            <OnboardingProgressBar step={step} />

            <View className="flex-row items-center justify-between">
                {isBackVisible ? (
                    <GoBackButton testID={OnboardingStepLayoutSelector.BackButton} onPress={onBack} />
                ) : (
                    <View className="p-md" pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                        <Icon icon={UserIconNameEnum.ChevronLeft} className="text-primary opacity-0" size={BACK_ICON_SIZE} />
                    </View>
                )}

                {isSkipVisible ? (
                    <HapticPressable testID={OnboardingStepLayoutSelector.SkipButton} onPress={onSkip} className="py-3xl">
                        <Text className="text-secondary-foreground/50 text-sm font-medium">
                            <Trans>Skip</Trans>
                        </Text>
                    </HapticPressable>
                ) : (
                    <View
                        className="py-3xl"
                        pointerEvents="none"
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    >
                        <Text className="text-sm font-medium opacity-0">
                            <Trans>Skip</Trans>
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};
