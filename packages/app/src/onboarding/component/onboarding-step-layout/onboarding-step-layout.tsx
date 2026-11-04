import { useFocusEffect } from 'expo-router';
import { ReactNode } from 'react';

import { BottomChromeInsetProvider, ScreenChromeFrame, ScreenChromeHeader } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { RevealGate } from '../../../@generic/component/reveal-gate/reveal-gate';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { updateSettingsMutation } from '../../../settings/mutation/update-settings.mutation';
import { ONBOARDING_STEP_ORDER } from '../../constant/onboarding-step-order.constant';
import { OnboardingFileLockEnum } from '../../enum/onboarding-file-lock.enum';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingStepFooter } from '../onboarding-step-footer/onboarding-step-footer';
import { OnboardingStepHeader } from '../onboarding-step-header/onboarding-step-header';
import { OnboardingStepScroll } from '../onboarding-step-scroll/onboarding-step-scroll';

import { OnboardingStepLayoutSelector } from './onboarding-step-layout.selector';

interface Props {
    readonly step: OnboardingStepEnum;
    readonly fileState: string;
    readonly fileLock: OnboardingFileLockEnum;
    readonly isLoading?: boolean;
    readonly footer?: ReactNode;
    readonly children: ReactNode;
}

export const OnboardingStepLayout = (props: Props) => {
    const { step, fileState, fileLock, isLoading = false, footer, children } = props;

    const { goBack } = useOnboardingNavigation();
    const onboardingStep = useSetting('onboardingStep');
    const stepIndex = ONBOARDING_STEP_ORDER.indexOf(step);

    useFocusEffect(() => {
        if (onboardingStep !== stepIndex) {
            appRuntime.runFork(logAndContinue(updateSettingsMutation({ onboardingStep: stepIndex })));
        }
    });

    const isBackVisible = step !== OnboardingStepEnum.SEALED;
    const headerRowStyle = { paddingHorizontal: 0 };

    return (
        <GroupedSurface testID={OnboardingStepLayoutSelector.Root}>
            <ScreenChromeThemeProvider>
                <BottomChromeInsetProvider>
                    <ScreenChromeFrame>
                        <ScreenChromeHeader inFlow rowStyle={headerRowStyle}>
                            <OnboardingStepHeader fileState={fileState} fileLock={fileLock} {...(isBackVisible && { onBack: goBack })} />
                        </ScreenChromeHeader>

                        <RevealGate isLoading={isLoading}>
                            <OnboardingStepScroll>{children}</OnboardingStepScroll>
                        </RevealGate>

                        {isDefined(footer) ? <OnboardingStepFooter>{footer}</OnboardingStepFooter> : null}
                    </ScreenChromeFrame>
                </BottomChromeInsetProvider>
            </ScreenChromeThemeProvider>
        </GroupedSurface>
    );
};
