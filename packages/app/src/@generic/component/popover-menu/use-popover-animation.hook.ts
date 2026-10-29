import { useEffect, useEffectEvent, useReducer, useRef } from 'react';
import { Platform } from 'react-native';
import { Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { EmptyFn } from '@rnw-community/shared';

import { PopoverAnimationActionTypeEnum } from '../../enum/popover-animation-action-type.enum';
import { PopoverAnimationActionInterface } from '../../interface/popover-animation-action.interface';
import { PopoverAnimationStateInterface } from '../../interface/popover-animation-state.interface';

const BACKDROP_OPACITY = 0.3;
const MENU_SCALE_CLOSED = 0.95;

const TIMING_CONFIG = { duration: 150, easing: Easing.out(Easing.cubic) };

const reducer = (state: PopoverAnimationStateInterface, action: PopoverAnimationActionInterface): PopoverAnimationStateInterface => {
    if (action.type === PopoverAnimationActionTypeEnum.OPEN_CHANGED) {
        return { previousIsOpen: action.isOpen, isClosing: !action.isOpen, isDismissing: !action.isOpen && Platform.OS === 'ios' };
    }
    if (action.type === PopoverAnimationActionTypeEnum.CLOSE_ANIMATION_FINISHED) {
        return { ...state, isClosing: false };
    }

    return { ...state, isDismissing: false };
};

export const usePopoverAnimation = (isOpen: boolean, onCloseComplete?: EmptyFn) => {
    const progress = useSharedValue(isOpen ? 1 : 0);
    const [{ previousIsOpen, isClosing, isDismissing }, dispatch] = useReducer(reducer, {
        previousIsOpen: isOpen,
        isClosing: false,
        isDismissing: false
    });
    const notifyCloseComplete = useEffectEvent(() => onCloseComplete?.());
    const isRendered = isOpen || isClosing || isDismissing;
    const wasRenderedRef = useRef(isRendered);

    if (isOpen !== previousIsOpen) {
        dispatch({ type: PopoverAnimationActionTypeEnum.OPEN_CHANGED, isOpen });
    }

    useEffect(() => {
        if (wasRenderedRef.current && !isRendered) {
            notifyCloseComplete();
        }

        wasRenderedRef.current = isRendered;
    }, [isRendered]);

    useEffect(() => {
        if (isOpen) {
            progress.set(withTiming(1, TIMING_CONFIG));
        } else if (isClosing) {
            progress.set(
                withTiming(0, TIMING_CONFIG, isFinished => {
                    if (isFinished) {
                        runOnJS(dispatch)({ type: PopoverAnimationActionTypeEnum.CLOSE_ANIMATION_FINISHED });
                    }
                })
            );
        }
    }, [isOpen, isClosing, progress]);

    const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.get() * BACKDROP_OPACITY }));
    const menuStyle = useAnimatedStyle(() => ({
        opacity: progress.get(),
        transform: [{ scale: interpolate(progress.get(), [0, 1], [MENU_SCALE_CLOSED, 1]) }]
    }));

    return {
        isRendered,
        isVisible: isOpen || isClosing,
        handleDismiss: () => void dispatch({ type: PopoverAnimationActionTypeEnum.NATIVE_DISMISSED }),
        backdropStyle,
        menuStyle
    };
};
