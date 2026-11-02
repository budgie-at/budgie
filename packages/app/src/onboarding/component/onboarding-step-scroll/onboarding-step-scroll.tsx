import { ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated from 'react-native-reanimated';

import { useBottomChromeInset, useScreenChromeScrollProps } from '@rnw-community/react-native-screen-chrome';

interface Props {
    readonly children: ReactNode;
}

const COMPACT_HEIGHT = 700;

const AnimatedKeyboardAwareScrollView = Animated.createAnimatedComponent(KeyboardAwareScrollView);

export const OnboardingStepScroll = ({ children }: Props) => {
    const { height } = useWindowDimensions();
    const { chromeHeight, inset } = useBottomChromeInset();
    const scrollProps = useScreenChromeScrollProps({
        includeTopSafeArea: false,
        contentInsetBottom: Math.max(chromeHeight + 16, 20)
    });

    const bottomOffset = inset + 16;
    const contentStyle = { rowGap: height <= COMPACT_HEIGHT ? 16 : 28 };

    return (
        <AnimatedKeyboardAwareScrollView
            {...scrollProps}
            bottomOffset={bottomOffset}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
        >
            <View className="px-5xl pt-md" style={contentStyle}>
                {children}
            </View>
        </AnimatedKeyboardAwareScrollView>
    );
};
