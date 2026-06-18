import { MaskedView } from '@expo/ui/community/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemeContext } from '../../../theme/context/theme.context';

type BlurGradientPosition = 'top' | 'bottom';

interface Props {
    readonly children?: ReactNode;
    readonly position: BlurGradientPosition;
    readonly height?: number;
    readonly edgeOffset?: number;
    readonly safeAreaTop?: number;
}

const GRADIENT_START = 0.45;
const GRADIENT_END = 0.45;
const DEFAULT_HEADER_HEIGHT = 112;
const DEFAULT_HEIGHT_BOTTOM = 112;
const DARK_GRADIENT_EDGE = '#000000';
const DARK_GRADIENT_TRANSPARENT = 'rgba(0, 0, 0, 0)';
const LIGHT_GRADIENT_EDGE = '#ffffff';
const LIGHT_GRADIENT_TRANSPARENT = 'rgba(255, 255, 255, 0)';

const GRADIENT_CONFIG = {
    top: {
        colors: {
            dark: [DARK_GRADIENT_EDGE, DARK_GRADIENT_TRANSPARENT] as const,
            light: [LIGHT_GRADIENT_EDGE, LIGHT_GRADIENT_TRANSPARENT] as const
        },
        locations: [GRADIENT_START, 1] as const
    },
    bottom: {
        colors: {
            dark: [DARK_GRADIENT_TRANSPARENT, DARK_GRADIENT_EDGE] as const,
            light: [LIGHT_GRADIENT_TRANSPARENT, LIGHT_GRADIENT_EDGE] as const
        },
        locations: [0, GRADIENT_END] as const
    }
} as const;

export const BlurGradient = (props: Props) => {
    const { children, position, height, edgeOffset = 0, safeAreaTop = 0 } = props;

    const { isDarkColorSchema } = useThemeContext();

    const config = GRADIENT_CONFIG[position];
    const computedHeight = position === 'top' ? safeAreaTop + DEFAULT_HEADER_HEIGHT : DEFAULT_HEIGHT_BOTTOM;
    const positionStyle = position === 'top' ? { top: -edgeOffset } : { bottom: -edgeOffset };
    const containerStyle = { height: (height ?? computedHeight) + edgeOffset, ...positionStyle };
    const gradientColors = isDarkColorSchema ? config.colors.dark : config.colors.light;
    const blurTint = isDarkColorSchema ? 'dark' : 'light';

    return (
        <>
            <View className="absolute inset-x-0" style={containerStyle} pointerEvents="none">
                <MaskedView
                    style={StyleSheet.absoluteFill}
                    maskElement={<LinearGradient colors={gradientColors} locations={config.locations} style={StyleSheet.absoluteFill} />}
                >
                    <BlurView style={StyleSheet.absoluteFill} intensity={50} tint={blurTint} blurMethod="dimezisBlurView" />
                </MaskedView>
                <LinearGradient colors={gradientColors} locations={config.locations} style={StyleSheet.absoluteFill} />
            </View>
            {children}
        </>
    );
};
