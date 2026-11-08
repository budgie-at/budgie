import Animated from 'react-native-reanimated';

import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';

interface Props {
    readonly frameStyle: StyleProp<AnimatedStyle<ViewStyle>>;
    readonly cardStyle: StyleProp<AnimatedStyle<ViewStyle>>;
    readonly isPageActive: boolean;
    readonly testID?: string;
    readonly children: ReactNode;
}

export const MorphingSheetCard = ({ frameStyle, cardStyle, isPageActive, testID, children }: Props) => {
    const pointerEvents = isPageActive ? 'none' : 'box-none';
    const importantForAccessibility = isPageActive ? 'no-hide-descendants' : 'auto';

    return (
        <Animated.View
            className="absolute overflow-hidden"
            style={frameStyle}
            pointerEvents={pointerEvents}
            accessibilityElementsHidden={isPageActive}
            importantForAccessibility={importantForAccessibility}
        >
            <Animated.View className="bg-sheet-surface absolute inset-x-0 top-0" style={cardStyle} testID={testID}>
                {children}
            </Animated.View>
        </Animated.View>
    );
};
