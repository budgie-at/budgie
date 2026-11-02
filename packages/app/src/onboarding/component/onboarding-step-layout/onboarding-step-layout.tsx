import { useFocusEffect } from 'expo-router';
import { ReactNode, useState } from 'react';
import { LayoutChangeEvent, useWindowDimensions, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined } from '@rnw-community/shared';

import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { FullPage } from '../../../@generic/component/page/full-page';
import { RevealGate } from '../../../@generic/component/reveal-gate/reveal-gate';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { cn } from '../../../@generic/utils/cn.util';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { updateSettingsMutation } from '../../../settings/mutation/update-settings.mutation';
import { ONBOARDING_STEP_ORDER } from '../../constant/onboarding-step-order.constant';
import { OnboardingFileLockEnum } from '../../enum/onboarding-file-lock.enum';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingStepHeader } from '../onboarding-step-header/onboarding-step-header';

import { OnboardingStepLayoutSelector } from './onboarding-step-layout.selector';

const FOOTER_CLEARANCE = 16;
const COMPACT_HEIGHT = 700;
const COMPACT_SECTION_GAP = 16;
const SECTION_GAP = 28;

interface Props {
    readonly step: OnboardingStepEnum;
    readonly fileState: string;
    readonly fileLock: OnboardingFileLockEnum;
    readonly isBackVisible?: boolean;
    readonly isLoading?: boolean;
    readonly footer?: ReactNode;
    readonly children: ReactNode;
}

export const OnboardingStepLayout = (props: Props) => {
    const { step, fileState, fileLock, isBackVisible = true, isLoading = false, footer, children } = props;

    const [footerHeight, setFooterHeight] = useState(0);

    const keyboardOffset = { closed: 0, opened: useSafeAreaInsets().bottom };
    const { height } = useWindowDimensions();
    const { goBack } = useOnboardingNavigation();
    const onboardingStep = useSetting('onboardingStep');
    const stepIndex = ONBOARDING_STEP_ORDER.indexOf(step);

    useFocusEffect(() => {
        if (onboardingStep !== stepIndex) {
            appRuntime.runFork(logAndContinue(updateSettingsMutation({ onboardingStep: stepIndex })));
        }
    });

    const handleFooterLayout = (event: LayoutChangeEvent) => void setFooterHeight(event.nativeEvent.layout.height);

    const hasFooter = isDefined(footer);
    const footerClearance = footerHeight + FOOTER_CLEARANCE;
    const contentStyle = {
        rowGap: height <= COMPACT_HEIGHT ? COMPACT_SECTION_GAP : SECTION_GAP,
        ...(hasFooter && { paddingBottom: footerClearance })
    };
    const contentPaddingClassName = hasFooter ? 'pb-0' : 'pb-5xl';
    const footerBar = hasFooter ? (
        <KeyboardStickyView offset={keyboardOffset} className="absolute inset-x-0 bottom-0">
            <View
                onLayout={handleFooterLayout}
                className="gap-y-xs border-t-hairline border-surface-separator bg-surface px-5xl pt-lg pb-md"
            >
                {footer}
            </View>
        </KeyboardStickyView>
    ) : null;

    return (
        <GroupedSurface>
            <FullPage
                testID={OnboardingStepLayoutSelector.Root}
                contentClassName="px-0"
                header={<OnboardingStepHeader fileState={fileState} fileLock={fileLock} isBackVisible={isBackVisible} onBack={goBack} />}
            >
                <View className="flex-1">
                    <RevealGate isLoading={isLoading}>
                        <KeyboardAwareScrollView
                            bottomOffset={footerClearance}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                        >
                            <View className={cn('px-5xl pt-md', contentPaddingClassName)} style={contentStyle}>
                                {children}
                            </View>
                        </KeyboardAwareScrollView>
                    </RevealGate>

                    {footerBar}
                </View>
            </FullPage>
        </GroupedSurface>
    );
};
