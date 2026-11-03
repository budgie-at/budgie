import { LayoutChangeEvent } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { OnboardingHoldToSealLabel } from '../onboarding-hold-to-seal-label/onboarding-hold-to-seal-label';

interface Props {
    readonly label: string;
    readonly isLoading: boolean;
    readonly progress: SharedValue<number>;
}

export const OnboardingHoldToSealFill = ({ label, isLoading, progress }: Props) => {
    const pillWidth = useSharedValue(0);

    const handleLayout = (event: LayoutChangeEvent) => void pillWidth.set(event.nativeEvent.layout.width);

    const wipeStyle = useAnimatedStyle(() => ({
        opacity: pillWidth.get() > 0 ? 1 : 0,
        transform: [{ translateX: (progress.get() - 1) * pillWidth.get() }]
    }));
    const invertedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: (1 - progress.get()) * pillWidth.get() }] }));

    return (
        <Animated.View
            onLayout={handleLayout}
            style={wipeStyle}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="absolute inset-0 overflow-hidden"
        >
            <Animated.View style={invertedStyle} className="absolute inset-0 justify-center bg-cta-foreground px-5xl py-md">
                <OnboardingHoldToSealLabel label={label} isLoading={isLoading} colorClassName="text-cta-background" />
            </Animated.View>
        </Animated.View>
    );
};
