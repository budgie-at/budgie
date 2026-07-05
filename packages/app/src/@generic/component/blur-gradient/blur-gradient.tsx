import { MaskedView } from '@expo/ui/community/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemeContext } from '../../../theme/context/theme.context';

import type { ColorValue } from 'react-native';

type BlurGradientPosition = 'top' | 'bottom';
type GradientColors = readonly [ColorValue, ColorValue];
type GradientColorSchema = {
    readonly dark: GradientColors;
    readonly light: GradientColors;
};

interface Props {
    readonly children?: ReactNode;
    readonly position: BlurGradientPosition;
    readonly height?: number;
    readonly edgeOffset?: number;
    readonly intensity?: number;
    readonly safeAreaTop?: number;
}

const DEFAULT_HEADER_HEIGHT = 112;
const DEFAULT_HEIGHT_BOTTOM = 112;
const MASK_LOCATIONS = [0, 0.5, 1] as const;
const DEFAULT_INTENSITY = 50;

const LIGHT_SOLID = 'rgba(255, 255, 255, 0.42)';
const LIGHT_WASH = 'rgba(255, 255, 255, 0.08)';
const DARK_SOLID = 'rgba(0, 0, 0, 0.48)';
const DARK_WASH = 'rgba(0, 0, 0, 0.12)';

const GRADIENT_CONFIG = {
    top: {
        mask: ['rgba(0, 0, 0, 0.99)', '#000000', 'transparent'] as const,
        overlay: { dark: [DARK_SOLID, DARK_WASH], light: [LIGHT_SOLID, LIGHT_WASH] } satisfies GradientColorSchema
    },
    bottom: {
        mask: ['transparent', '#000000', 'rgba(0, 0, 0, 0.99)'] as const,
        overlay: { dark: [DARK_WASH, DARK_SOLID], light: [LIGHT_WASH, LIGHT_SOLID] } satisfies GradientColorSchema
    }
} as const;

export const BlurGradient = (props: Props) => {
    const { children, position, height, edgeOffset = 0, intensity = DEFAULT_INTENSITY, safeAreaTop = 0 } = props;

    const { isDarkColorSchema } = useThemeContext();

    const config = GRADIENT_CONFIG[position];
    const computedHeight = position === 'top' ? safeAreaTop + DEFAULT_HEADER_HEIGHT : DEFAULT_HEIGHT_BOTTOM;
    const positionStyle = position === 'top' ? { top: -edgeOffset } : { bottom: -edgeOffset };
    const containerStyle = { height: (height ?? computedHeight) + edgeOffset, ...positionStyle };
    const overlayColors = isDarkColorSchema ? config.overlay.dark : config.overlay.light;
    const blurTint = isDarkColorSchema ? 'dark' : 'light';

    return (
        <>
            <View className="absolute inset-x-0" style={containerStyle} pointerEvents="none">
                <MaskedView
                    style={StyleSheet.absoluteFill}
                    maskElement={<LinearGradient colors={config.mask} locations={MASK_LOCATIONS} style={StyleSheet.absoluteFill} />}
                >
                    <LinearGradient colors={overlayColors} style={StyleSheet.absoluteFill} />
                    <BlurView style={StyleSheet.absoluteFill} intensity={intensity} tint={blurTint} />
                </MaskedView>
            </View>
            {children}
        </>
    );
};
