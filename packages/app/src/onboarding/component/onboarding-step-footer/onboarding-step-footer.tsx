import { ReactNode } from 'react';
import { View } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';

interface Props {
    readonly children: ReactNode;
}

const HIDDEN_EDGE_FADE_PROPS = { style: { display: 'none' } } as const;
const IN_FLOW_STYLE = { position: 'relative' } as const;

export const OnboardingStepFooter = ({ children }: Props) => {
    const { height, progress } = useReanimatedKeyboardAnimation();
    const { bottom } = useSafeAreaInsets();
    const keyboardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: height.value + bottom * progress.value }] }));

    return (
        <Animated.View className="absolute inset-x-0 bottom-0" style={keyboardStyle} pointerEvents="box-none">
            <ScreenChromeFooter includeBottomSafeArea={false} edgeFadeProps={HIDDEN_EDGE_FADE_PROPS} style={IN_FLOW_STYLE}>
                <View className="gap-y-xs border-t-hairline border-surface-separator bg-surface px-5xl pt-lg pb-safe-offset-[8px]">
                    {children}
                </View>
            </ScreenChromeFooter>
        </Animated.View>
    );
};
