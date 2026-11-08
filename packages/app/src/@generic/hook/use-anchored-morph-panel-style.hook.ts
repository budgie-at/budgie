import { useWindowDimensions } from 'react-native';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { Extrapolation, interpolate, interpolateColor, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResolveClassNames, useUniwind } from 'uniwind';

import { isDefined, isString } from '@rnw-community/shared';

import { MORPHING_SHEET_MAX_WIDTH } from '../constant/morphing-sheet-max-width.constant';

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
    contentHeight: SharedValue<number> | null,
    origin: AnchoredMorphOriginInterface
) => {
    const fitsContent = isDefined(contentHeight);
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const { top, bottom } = useSafeAreaInsets();
    const { theme } = useUniwind();
    const isReducedMotion = useReducedMotion();
    const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
    const { backgroundColor } = useResolveClassNames('bg-sheet-surface');

    const panelWidth = Math.min(windowWidth - PANEL_MARGIN * 2, MORPHING_SHEET_MAX_WIDTH);
    const topInset = top + PANEL_TOP_GAP;
    const sheetColor = isString(backgroundColor) ? backgroundColor : origin.color;

    const panelStyle = useAnimatedStyle(() => {
        const current = progress.get();
        const panelLeft = (windowWidth - panelWidth) / 2;
        const keyboardInset = Math.max(Math.abs(keyboardHeight.get()), bottom);
        const panelBottom = windowHeight - keyboardInset - PANEL_BOTTOM_GAP;
        const measuredHeight = contentHeight?.get() ?? 0;
        const isMeasured = measuredHeight > 0;
        const targetHeight = isMeasured ? Math.min(measuredHeight, panelBottom - topInset) : panelBottom - topInset;
        const targetTop = isMeasured ? Math.max(topInset, Math.min(origin.rect.y, panelBottom - targetHeight)) : topInset;

        if (isReducedMotion) {
            return {
                left: panelLeft,
                top: targetTop,
                width: panelWidth,
                height: targetHeight,
                borderRadius: PANEL_RADIUS,
                borderCurve: 'continuous',
                backgroundColor: sheetColor,
                opacity: current
            };
        }

        return {
            left: interpolate(current, PROGRESS_RANGE, [origin.rect.x, panelLeft], Extrapolation.CLAMP),
            top: interpolate(current, PROGRESS_RANGE, [origin.rect.y, targetTop], Extrapolation.CLAMP),
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
            height: fitsContent ? void 0 : windowHeight - topInset - keyboardInset - PANEL_BOTTOM_GAP,
            opacity: interpolate(progress.get(), CONTENT_FADE_RANGE, PROGRESS_RANGE, Extrapolation.CLAMP)
        };
    });

    const scrimStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            progress.get(),
            PROGRESS_RANGE,
            [0, theme === 'dark' ? SCRIM_OPACITY_DARK : SCRIM_OPACITY_LIGHT],
            Extrapolation.CLAMP
        )
    }));

    return { panelStyle, ghostStyle, contentStyle, scrimStyle };
};
