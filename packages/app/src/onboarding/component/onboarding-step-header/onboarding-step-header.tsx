import { View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { OnboardingFileLockEnum } from '../../enum/onboarding-file-lock.enum';
import { OnboardingFileStrip } from '../onboarding-file-strip/onboarding-file-strip';
import { OnboardingStepLayoutSelector } from '../onboarding-step-layout/onboarding-step-layout.selector';

interface Props {
    readonly fileState: string;
    readonly fileLock?: OnboardingFileLockEnum;
    readonly isFileSealed?: boolean;
    readonly isBackVisible: boolean;
    readonly onBack: EmptyFn;
}

export const OnboardingStepHeader = ({ fileState, fileLock, isFileSealed = false, isBackVisible, onBack }: Props) => {
    const sealedLock = isFileSealed ? OnboardingFileLockEnum.SEALED : OnboardingFileLockEnum.OPEN;
    const lock = fileLock ?? sealedLock;

    return (
        <View className="bg-surface px-5xl pt-lg pb-lg flex-row items-center gap-x-md">
            {isBackVisible ? (
                <GoBackButton
                    testID={OnboardingStepLayoutSelector.BackButton}
                    className="size-[44px] items-center justify-center p-0"
                    onPress={onBack}
                />
            ) : (
                <View className="size-[44px]" />
            )}

            <OnboardingFileStrip state={fileState} lock={lock} />
        </View>
    );
};
