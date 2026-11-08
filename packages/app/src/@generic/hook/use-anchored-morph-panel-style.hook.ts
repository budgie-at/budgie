import { useWindowDimensions } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { Extrapolation, interpolate, interpolateColor, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResolveClassNames, useUniwind } from 'uniwind';

import { isString } from '@rnw-community/shared';

import { useReducedMotion } from './use-reduced-motion.hook';

import type { AnchoredMorphOriginInterface } from '../interface/anchored-morph-origin.interface';
import type { SharedValue } from 'react-native-reanimated';

const PANEL_MARGIN = 12;
const PANEL_TOP_GAP = 8;
const PANEL_BOTTOM_GAP = 8;
const PANEL_RADIUS = 32;
const GHOST_FADE_END = 0.35;
const CONTENT_FADE_START = 0.15;
const CONTENT_FADE_END = 0.6;
const SCRIM_OPACITY_LIGHT = 0.5;
const SCRIM_OPACITY_DARK = 0.8;
const PROGRESS_RANGE = [0, 1];
const GHOST_FADE_RANGE = [0, GHOST_FADE_END];
const CONTENT_FADE_RANGE = [CONTENT_FADE_START, CONTENT_FADE_END];

export const useAnchoredMorphPanelStyle = (
    progress: SharedValue<number>,
    settledKeyboardHeight: SharedValue<number>,
    origin: AnchoredMorphOriginInterface
) => {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const { top, bottom } = useSafeAreaInsets();
    const { theme } = useUniwind();
    const isReducedMotion = useReducedMotion();
    const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
    const { backgroundColor } = useResolveClassNames('bg-sheet-surface');

    const panelWidth = windowWidth - PANEL_MARGIN * 2;
    const topInset = top + PANEL_TOP_GAP;
    const sheetColor = isString(backgroundColor) ? backgroundColor : origin.color;
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
                backgroundColor: sheetColor,
                opacity: current
            };
        }

        return {
            left: interpolate(current, PROGRESS_RANGE, [origin.rect.x, PANEL_MARGIN], Extrapolation.CLAMP),
            top: interpolate(current, PROGRESS_RANGE, [origin.rect.y, topInset], Extrapolation.CLAMP),
            width: interpolate(current, PROGRESS_RANGE, [origin.rect.width, panelWidth], Extrapolation.CLAMP),
            height: interpolate(current, PROGRESS_RANGE, [origin.rect.height, targetHeight], Extrapolation.CLAMP),
            borderTopLeftRadius: interpolate(current, PROGRESS_RANGE, [origin.radii.topLeft, PANEL_RADIUS], Extrapolation.CLAMP),
            borderTopRightRadius: interpolate(current, PROGRESS_RANGE, [origin.radii.topRight, PANEL_RADIUS], Extrapolation.CLAMP),
            borderBottomLeftRadius: interpolate(current, PROGRESS_RANGE, [origin.radii.bottomLeft, PANEL_RADIUS], Extrapolation.CLAMP),
            borderBottomRightRadius: interpolate(current, PROGRESS_RANGE, [origin.radii.bottomRight, PANEL_RADIUS], Extrapolation.CLAMP),
            borderCurve: 'continuous',
            backgroundColor: interpolateColor(current, PROGRESS_RANGE, [origin.color, sheetColor])
        };
    });

    const ghostStyle = useAnimatedStyle(() => ({
        width: origin.rect.width,
        height: origin.rect.height,
        opacity: isReducedMotion ? 0 : interpolate(progress.get(), GHOST_FADE_RANGE, [1, 0], Extrapolation.CLAMP)
    }));

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

    return { panelStyle, ghostStyle, contentStyle, scrimStyle };
};
