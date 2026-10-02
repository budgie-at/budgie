import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';
import { getDefined, isDefined } from '@rnw-community/shared';

import { useEdgeFadeBlurProps } from './hook/use-edge-fade-blur-props.hook';
import { useEdgeFadeOpacityStyle } from './hook/use-edge-fade-opacity-style.hook';
import { getEdgeFadeBandMetrics } from './utils/edge-fade-get-band-metrics.util';
import { getEdgeFadeMaskStops } from './utils/edge-fade-get-mask-stops.util';
import { getEdgeFadeWashColors } from './utils/edge-fade-get-wash-colors.util';
import { getBlurTint } from './utils/get-blur-tint.util';

import type { EdgeFadePosition, EdgeFadeScrollAnimationInterface } from '@rnw-community/react-native-screen-chrome';
import type { BlurMethod } from 'expo-blur';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

interface Props {
    readonly position: EdgeFadePosition;
    readonly height?: number;
    readonly intensity?: number;
    readonly scrollAnimation?: EdgeFadeScrollAnimationInterface;
    readonly blurMethod?: BlurMethod;
    readonly style?: StyleProp<ViewStyle>;
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 0, y: 1 };

const edgeFadeStyles = StyleSheet.create({
    band: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 2
    },
    fill: {
        flex: 1
    }
});

export const EdgeFade = ({ position, height, intensity, scrollAnimation, blurMethod = 'dimezisBlurView', style }: Props): ReactNode => {
    const { config, colorScheme } = useScreenChrome();
    const insets = useSafeAreaInsets();
    const resolvedIntensity = getDefined(intensity, () => config.intensity);
    const resolvedMaxIntensity = getDefined(scrollAnimation?.maxIntensity, () => config.maxBlurIntensity);
    const washColors = getEdgeFadeWashColors(position, config.colors[colorScheme]);
    const maskGradient = getEdgeFadeMaskStops(config.maskStops, position);
    const containerAnimatedStyle = useEdgeFadeOpacityStyle(scrollAnimation?.opacityInputRange);
    const animatedBlurProps = useEdgeFadeBlurProps(scrollAnimation?.intensityInputRange, resolvedMaxIntensity, resolvedIntensity);
    const bandStyle = [edgeFadeStyles.band, getEdgeFadeBandMetrics(position, height, config, insets), containerAnimatedStyle, style];
    const blurIntensityProps = isDefined(scrollAnimation) ? { animatedProps: animatedBlurProps } : { intensity: resolvedIntensity };
    const maskElement = (
        <LinearGradient
            colors={maskGradient.colors}
            locations={maskGradient.locations}
            start={GRADIENT_START}
            end={GRADIENT_END}
            style={edgeFadeStyles.fill}
        />
    );

    return (
        <Animated.View
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={bandStyle}
        >
            <MaskedView style={edgeFadeStyles.fill} maskElement={maskElement}>
                <LinearGradient colors={washColors} start={GRADIENT_START} end={GRADIENT_END} style={edgeFadeStyles.fill} />
                <AnimatedBlurView
                    style={StyleSheet.absoluteFill}
                    tint={getBlurTint(colorScheme, Platform.OS === 'ios')}
                    blurMethod={blurMethod}
                    {...blurIntensityProps}
                />
            </MaskedView>
        </Animated.View>
    );
};
