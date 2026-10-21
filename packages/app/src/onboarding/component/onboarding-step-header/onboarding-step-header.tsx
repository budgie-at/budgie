import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { OnboardingFileStrip } from '../onboarding-file-strip/onboarding-file-strip';
import { OnboardingStepLayoutSelector } from '../onboarding-step-layout/onboarding-step-layout.selector';

interface Props {
    readonly fileState: string;
    readonly isFileSealed: boolean;
    readonly isBackVisible: boolean;
    readonly onBack: EmptyFn;
}

export const OnboardingStepHeader = ({ fileState, isFileSealed, isBackVisible, onBack }: Props) => (
    <View className="px-5xl pt-lg pb-3xl flex-row items-center gap-x-md">
        {isBackVisible ? <GoBackButton testID={OnboardingStepLayoutSelector.BackButton} onPress={onBack} /> : null}

        <OnboardingFileStrip state={fileState} isSealed={isFileSealed} />
    </View>
);
