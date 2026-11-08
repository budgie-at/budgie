import { useWindowDimensions } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUniwind } from 'uniwind';

import { useReducedMotion } from './use-reduced-motion.hook';

import type { WindowRectInterface } from '../interface/window-rect.interface';
import type { SharedValue } from 'react-native-reanimated';

const PANEL_MARGIN = 12;
const PANEL_TOP_GAP = 8;
const PANEL_BOTTOM_GAP = 8;
const PANEL_RADIUS = 32;
const BACKGROUND_FADE_END = 0.2;
const CONTENT_FADE_START = 0.25;
const CONTENT_FADE_END = 0.7;
const SCRIM_OPACITY_LIGHT = 0.5;
const SCRIM_OPACITY_DARK = 0.8;
const PROGRESS_RANGE = [0, 1];
const BACKGROUND_FADE_RANGE = [0, BACKGROUND_FADE_END];
const CONTENT_FADE_RANGE = [CONTENT_FADE_START, CONTENT_FADE_END];

export const useAnchoredMorphPanelStyle = (
    progress: SharedValue<number>,
    settledKeyboardHeight: SharedValue<number>,
    originRect: WindowRectInterface,
    originRadius: number
) => {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const { top, bottom } = useSafeAreaInsets();
    const { theme } = useUniwind();
    const isReducedMotion = useReducedMotion();
    const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

    const panelWidth = windowWidth - PANEL_MARGIN * 2;
    const topInset = top + PANEL_TOP_GAP;
    const scrimOpacity = theme === 'dark' ? SCRIM_OPACITY_DARK : SCRIM_OPACITY_LIGHT;

    const panelStyle = useAnimatedStyle(() => {
        const current = progress.get();
        const keyboardInset = Math.max(Math.abs(keyboardHeight.get()), bottom);
        const targetHeight = windowHeight - topInset - keyboardInset - PANEL_BOTTOM_GAP;

        if (isReducedMotion) {
            return {
                left: PANEL_MARGIN,
                top: topInset,
                width: panelWidth,
                height: targetHeight,
                borderRadius: PANEL_RADIUS,
                borderCurve: 'continuous',
                opacity: current
            };
        }

        return {
            left: interpolate(current, PROGRESS_RANGE, [originRect.x, PANEL_MARGIN], Extrapolation.CLAMP),
            top: interpolate(current, PROGRESS_RANGE, [originRect.y, topInset], Extrapolation.CLAMP),
            width: interpolate(current, PROGRESS_RANGE, [originRect.width, panelWidth], Extrapolation.CLAMP),
            height: interpolate(current, PROGRESS_RANGE, [originRect.height, targetHeight], Extrapolation.CLAMP),
            borderRadius: interpolate(current, PROGRESS_RANGE, [originRadius, PANEL_RADIUS], Extrapolation.CLAMP),
            borderCurve: 'continuous',
            opacity: interpolate(current, BACKGROUND_FADE_RANGE, PROGRESS_RANGE, Extrapolation.CLAMP)
        };
    });

    const contentStyle = useAnimatedStyle(() => {
        const keyboardInset = Math.max(settledKeyboardHeight.get(), Math.abs(keyboardHeight.get()), bottom);

        return {
            width: panelWidth,
            height: windowHeight - topInset - keyboardInset - PANEL_BOTTOM_GAP,
            opacity: interpolate(progress.get(), CONTENT_FADE_RANGE, PROGRESS_RANGE, Extrapolation.CLAMP)
        };
    });

    const scrimStyle = useAnimatedStyle(() => ({
        opacity: interpolate(progress.get(), PROGRESS_RANGE, [0, scrimOpacity], Extrapolation.CLAMP)
    }));

    return { panelStyle, contentStyle, scrimStyle };
};
