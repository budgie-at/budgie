import { View } from 'react-native';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { OnboardingFileLockEnum } from '../../enum/onboarding-file-lock.enum';
import { OnboardingFileStrip } from '../onboarding-file-strip/onboarding-file-strip';
import { OnboardingStepLayoutSelector } from '../onboarding-step-layout/onboarding-step-layout.selector';

interface Props {
    readonly fileState: string;
    readonly fileLock: OnboardingFileLockEnum;
    readonly onBack?: EmptyFn;
}

export const OnboardingStepHeader = ({ fileState, fileLock, onBack }: Props) => (
    <View className="w-full bg-surface px-5xl pt-lg pb-lg flex-row items-center gap-x-md">
        {isDefined(onBack) ? (
            <GoBackButton testID={OnboardingStepLayoutSelector.BackButton} className="m-0 size-[44px]" onPress={onBack} />
        ) : (
            <View className="size-[44px]" />
        )}

        <OnboardingFileStrip state={fileState} lock={fileLock} />
    </View>
);
