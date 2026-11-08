import { useEffect, useEffectEvent, useRef } from 'react';
import { Text } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    LayoutAnimationConfig,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { BUTTON_PRESSED_SCALE, EASE_OUT, MOTION_BASE_DURATION, MOTION_FAST_DURATION } from '../../../@generic/constant/motion.constant';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';

interface Props {
    readonly label: string;
    readonly isReady: boolean;
    readonly isLoading: boolean;
    readonly isDisabled: boolean;
    readonly onPress: () => void;
    readonly testID: string;
}

const LABEL_ENTERING = FadeIn.duration(MOTION_BASE_DURATION).easing(EASE_OUT);
const LABEL_EXITING = FadeOut.duration(MOTION_FAST_DURATION).easing(EASE_OUT);
const POP_START_SCALE = 0.97;
const POP_SPRING = { dampingRatio: 0.6, duration: 350 };

export const CategoryFormSubmitButton = ({ label, isReady, isLoading, isDisabled, onPress, testID }: Props) => {
    const [, , hapticSelection] = useVibration();
    const isReducedMotion = useReducedMotion();
    const previousReadyRef = useRef(isReady);
    const readiness = useSharedValue(isReady ? 1 : 0);
    const scale = useSharedValue(1);
    const labelKey = `${isReady}-${label}`;
    const labelClassName = isReady
        ? 'text-center text-[17px] font-semibold text-positive-action-foreground'
        : 'text-center text-[17px] font-semibold text-secondary-foreground';
    const isInactive = isLoading || isDisabled;
    const accessibilityState = { busy: isLoading, disabled: isInactive };

    const readyStyle = useAnimatedStyle(() => ({ opacity: readiness.get() }));
    const popStyle = useAnimatedStyle(() => ({ borderCurve: 'continuous', transform: [{ scale: scale.get() }] }));

    const handleBecameReady = useEffectEvent(() => {
        hapticSelection();

        if (!isReducedMotion) {
            scale.set(withSequence(withTiming(POP_START_SCALE, { duration: 0 }), withSpring(1, POP_SPRING)));
        }
    });

    useEffect(() => {
        readiness.set(withTiming(isReady ? 1 : 0, { duration: MOTION_BASE_DURATION, easing: EASE_OUT }));

        if (previousReadyRef.current === isReady) {
            return;
        }

        previousReadyRef.current = isReady;

        if (isReady) {
            handleBecameReady();
        }
    }, [isReady, readiness]);

    return (
        <HapticPressable
            pressedScale={BUTTON_PRESSED_SCALE}
            pressFeedback={HapticPressFeedbackEnum.COMMIT}
            onPress={onPress}
            disabled={isInactive}
            className="h-[56px] w-full"
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={accessibilityState}
            testID={testID}
        >
            <Animated.View className="h-full w-full overflow-hidden rounded-full bg-cta-disabled-background" style={popStyle}>
                <Animated.View className="absolute inset-0 bg-positive-action" style={readyStyle} />
                <LoadingContent isLoading={isLoading} containerClassName="absolute inset-0" className="h-full w-full">
                    <LayoutAnimationConfig skipEntering>
                        <Animated.View
                            key={labelKey}
                            entering={LABEL_ENTERING}
                            exiting={LABEL_EXITING}
                            className="absolute inset-0 items-center justify-center"
                        >
                            <Text className={labelClassName} numberOfLines={1}>
                                {label}
                            </Text>
                        </Animated.View>
                    </LayoutAnimationConfig>
                </LoadingContent>
            </Animated.View>
        </HapticPressable>
    );
};
