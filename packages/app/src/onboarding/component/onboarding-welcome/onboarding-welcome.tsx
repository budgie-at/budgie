import { View, useWindowDimensions } from 'react-native';

import { ScreenChromeFooter, ScreenChromeFrame, ScreenChromeScrollView } from '@rnw-community/react-native-screen-chrome';

import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { OnboardingStepEnum } from '../../enum/onboarding-step.enum';
import { useOnboardingNavigation } from '../../hook/use-onboarding-navigation.hook';
import { OnboardingWelcomeActions } from '../onboarding-welcome-actions/onboarding-welcome-actions';
import { OnboardingWelcomeHero } from '../onboarding-welcome-hero/onboarding-welcome-hero';

import { OnboardingWelcomeSelector } from './onboarding-welcome.selector';

const WELCOME_INLINE_FONT_SCALE_LIMIT = 1.2;
const IN_FLOW_STYLE = { position: 'relative' } as const;

export const OnboardingWelcome = () => {
    const { fontScale } = useWindowDimensions();
    const { goToStep } = useOnboardingNavigation();
    const handleStartPress = () => void goToStep(OnboardingStepEnum.KEY);
    const contentContainerStyle = {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 32,
        rowGap: 48
    } as const;
    const actions = <OnboardingWelcomeActions onStart={handleStartPress} />;
    const inlineActions = fontScale > WELCOME_INLINE_FONT_SCALE_LIMIT ? null : actions;
    const footer =
        fontScale > WELCOME_INLINE_FONT_SCALE_LIMIT ? (
            <ScreenChromeFooter includeBottomSafeArea={false} style={IN_FLOW_STYLE}>
                <View className="bg-surface px-5xl pt-lg pb-safe-offset-[8px]">{actions}</View>
            </ScreenChromeFooter>
        ) : null;

    return (
        <GroupedSurface testID={OnboardingWelcomeSelector.Root}>
            <ScreenChromeThemeProvider>
                <ScreenChromeFrame>
                    <ScreenChromeScrollView contentContainerStyle={contentContainerStyle}>
                        <OnboardingWelcomeHero />
                        {inlineActions}
                    </ScreenChromeScrollView>
                    {footer}
                </ScreenChromeFrame>
            </ScreenChromeThemeProvider>
        </GroupedSurface>
    );
};
