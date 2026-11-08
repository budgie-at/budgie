import { ReactNode } from 'react';
import { View } from 'react-native';
import { useKeyboardState, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';

import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly children: ReactNode;
}

const IN_FLOW_STYLE = { position: 'relative' } as const;

export const OnboardingStepFooter = ({ children }: Props) => {
    const isKeyboardVisible = useKeyboardState(state => state.isVisible);
    const { height } = useReanimatedKeyboardAnimation();
    const keyboardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: height.value }] }));

    const paddingClassName = isKeyboardVisible ? 'pt-sm pb-sm' : 'pt-lg pb-safe-offset-[8px]';

    return (
        <Animated.View className="absolute inset-x-0 bottom-0" style={keyboardStyle} pointerEvents="box-none">
            <ScreenChromeFooter includeBottomSafeArea={false} style={IN_FLOW_STYLE}>
                <View className="bg-surface">
                    <View className={cn('gap-y-xs px-5xl', paddingClassName)}>{children}</View>
                </View>
            </ScreenChromeFooter>
        </Animated.View>
    );
};
