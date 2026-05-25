import { MaskedView } from '@expo/ui/community/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useThemeContext } from '../../../theme/context/theme.context';
import { cn } from '../../utils/cn.util';

type BlurGradientPosition = 'top' | 'bottom';

interface Props {
    readonly children?: ReactNode;
    readonly position: BlurGradientPosition;
    readonly height?: number;
    readonly safeAreaTop?: number;
}

const GRADIENT_START = 0.6;
const GRADIENT_END = 0.6;
const DEFAULT_HEADER_HEIGHT = 150;
const DEFAULT_HEIGHT_BOTTOM = 150;

const GRADIENT_CONFIG = {
    top: {
        colors: { dark: ['#000000', 'transparent'] as const, light: ['#ffffff', 'transparent'] as const },
        locations: [GRADIENT_START, 1] as const
    },
    bottom: {
        colors: { dark: ['transparent', '#000000'] as const, light: ['transparent', '#ffffff'] as const },
        locations: [0, GRADIENT_END] as const
    }
} as const;

export const BlurGradient = (props: Props) => {
    const { children, position, height, safeAreaTop = 0 } = props;

    const { isDarkColorSchema } = useThemeContext();

    const config = GRADIENT_CONFIG[position];
    const computedHeight = position === 'top' ? safeAreaTop + DEFAULT_HEADER_HEIGHT : DEFAULT_HEIGHT_BOTTOM;
    const containerStyle = { height: height ?? computedHeight };
    const gradientColors = isDarkColorSchema ? config.colors.dark : config.colors.light;
    const blurTint = isDarkColorSchema ? 'dark' : 'light';
    const positionClassName = position === 'top' ? ' top-0' : 'bottom-0';

    return (
        <>
            <View className={cn('absolute inset-x-0 ', positionClassName)} style={containerStyle} pointerEvents="none">
                <MaskedView
                    style={StyleSheet.absoluteFill}
                    maskElement={<LinearGradient colors={gradientColors} locations={config.locations} style={StyleSheet.absoluteFill} />}
                >
                    <BlurView style={StyleSheet.absoluteFill} intensity={50} tint={blurTint} blurMethod="dimezisBlurView" />
                </MaskedView>
            </View>
            {children}
        </>
    );
};
