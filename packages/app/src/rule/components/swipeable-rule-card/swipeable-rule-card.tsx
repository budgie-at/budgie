import { UserIconNameEnum } from '@budgie/contracts';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Extrapolation,
    interpolate,
    ReduceMotion,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import {
    EASE_OUT,
    MOTION_FADE_IN,
    MOTION_FADE_OUT,
    MOTION_FAST_DURATION,
    MOTION_LAYOUT,
    SPRING_SETTLE
} from '../../../@generic/constant/motion.constant';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { RuleIndicatorPill } from '../rule-indicator-pill/rule-indicator-pill';

import type { AppServices } from '../../../@generic/runtime/app.runtime';
import type * as Fiber from 'effect/Fiber';

const ENTRY_FADE_CONFIG = { duration: 150, easing: EASE_OUT, reduceMotion: ReduceMotion.System };
const SNAP_BACK_SPRING = { dampingRatio: 0.8, duration: 400 };
const SWIPE_THRESHOLD = 80;
const DRAGGED_MIN_OPACITY = 0.35;
const VELOCITY_DISMISS = 800;
const MAX_RUBBER_BAND = 24;
const RUBBER_BAND_FACTOR = 2;
const SLIDE_OUT_DISTANCE = 300;
const SUCCESS_AUTO_DISMISS_MS = 2000;
const ERROR_AUTO_DISMISS_MS = 3000;

type CardStatus = 'idle' | 'creating' | 'success' | 'error';

interface Props {
    readonly descriptionText: string;
    readonly successMessage: ReactNode;
    readonly errorMessage: ReactNode;
    readonly cardTestID?: string;
    readonly buttonTestID?: string;
    readonly onYes: Effect.Effect<boolean, Cause.YieldableError, AppServices>;
    readonly onComplete: () => void;
    readonly onDismiss: () => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements -- Shared card component with gesture handling, animations, and multiple render states
export const SwipeableRuleCard = (props: Props) => {
    const { descriptionText, successMessage, errorMessage, cardTestID, buttonTestID, onYes, onComplete, onDismiss } = props;

    const [status, setStatus] = useState<CardStatus>('idle');
    const [hapticNotification, hapticImpact] = useVibration();
    const fiberRef = useRef<Fiber.Fiber<void> | null>(null);

    const translateX = useSharedValue(0);
    const opacity = useSharedValue(0);
    const didTriggerThresholdHaptic = useSharedValue(false);

    useEffect(() => {
        opacity.set(withTiming(1, ENTRY_FADE_CONFIG));
    }, [opacity]);

    useEffect(
        () => () => {
            fiberRef.current?.interruptUnsafe();
        },
        []
    );

    const handleSwipeThresholdReached = () => {
        hapticImpact(ImpactFeedbackStyle.Rigid);
    };

    const isSuccess = status === 'success';
    const isError = status === 'error';
    const isStatus = isSuccess || isError;
    const isCreating = status === 'creating';
    const isInteractive = !isStatus;

    const panGesture = Gesture.Pan()
        .enabled(isInteractive)
        .activeOffsetX([-10, 10])
        .onUpdate(event => {
            const isRightward = event.translationX > 0;
            const rubberBand = -Math.min(MAX_RUBBER_BAND, Math.sqrt(-event.translationX) * RUBBER_BAND_FACTOR);
            const translation = isRightward ? event.translationX : rubberBand;
            translateX.set(translation);

            if (translation >= SWIPE_THRESHOLD) {
                if (!didTriggerThresholdHaptic.get()) {
                    didTriggerThresholdHaptic.set(true);
                    scheduleOnRN(handleSwipeThresholdReached);
                }
            } else {
                didTriggerThresholdHaptic.set(false);
            }
        })
        .onEnd(event => {
            const didTickThreshold = didTriggerThresholdHaptic.get();
            didTriggerThresholdHaptic.set(false);

            const isDismissed = event.translationX > 0 && (event.translationX >= SWIPE_THRESHOLD || event.velocityX > VELOCITY_DISMISS);

            if (isDismissed) {
                if (!didTickThreshold) {
                    scheduleOnRN(handleSwipeThresholdReached);
                }

                translateX.set(withSpring(SLIDE_OUT_DISTANCE, { ...SPRING_SETTLE, velocity: event.velocityX }));
                opacity.set(
                    withTiming(0, { duration: MOTION_FAST_DURATION, easing: EASE_OUT }, isFinished => {
                        if (isFinished) {
                            scheduleOnRN(onDismiss);
                        }
                    })
                );
            } else {
                translateX.set(withSpring(0, { ...SNAP_BACK_SPRING, velocity: event.velocityX }));
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.get() }],
        opacity: opacity.get() * interpolate(translateX.get(), [0, SWIPE_THRESHOLD], [1, DRAGGED_MIN_OPACITY], Extrapolation.CLAMP)
    }));

    const handleYesButtonPress = () => {
        fiberRef.current = appRuntime.runFork(
            Effect.gen(function* () {
                setStatus('creating');
                const isCompleted = yield* Effect.uninterruptible(onYes);

                if (!isCompleted) {
                    setStatus('idle');

                    return;
                }

                setStatus('success');
                hapticNotification(NotificationFeedbackType.Success);
                yield* Effect.sleep(SUCCESS_AUTO_DISMISS_MS);
                onComplete();
            }).pipe(
                Effect.catchCause(cause =>
                    Cause.hasInterruptsOnly(cause)
                        ? Effect.void
                        : Effect.gen(function* () {
                              yield* Effect.logError(cause);
                              setStatus('error');
                              hapticNotification(NotificationFeedbackType.Error);
                              yield* Effect.sleep(ERROR_AUTO_DISMISS_MS);
                              onDismiss();
                          })
                )
            )
        );
    };

    const trailingContent = isCreating ? <ActivityIndicator size="small" /> : null;
    const statusIcon = isSuccess ? UserIconNameEnum.CircleCheck : UserIconNameEnum.CircleAlert;
    const statusIconClassName = isSuccess ? 'text-positive-foreground' : 'text-destructive-foreground';
    const statusTextClassName = isSuccess
        ? 'text-xs text-secondary-foreground font-medium shrink-0'
        : 'text-xs text-destructive-foreground font-medium shrink-0';
    const statusMessage = isSuccess ? successMessage : errorMessage;
    const pillContentKey = isStatus ? status : 'action';
    const pillContent = isStatus ? (
        <RuleIndicatorPill icon={statusIcon} iconClassName={statusIconClassName} textClassName={statusTextClassName}>
            {statusMessage}
        </RuleIndicatorPill>
    ) : (
        <HapticPressable
            testID={buttonTestID}
            onPress={handleYesButtonPress}
            pressFeedback={HapticPressFeedbackEnum.COMMIT}
            disabled={isCreating}
            className="self-center"
        >
            <RuleIndicatorPill
                icon={UserIconNameEnum.Zap}
                className="self-center"
                trailingContent={trailingContent}
                textClassName="shrink-0"
            >
                {descriptionText}
            </RuleIndicatorPill>
        </HapticPressable>
    );

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={animatedStyle}>
                <View testID={cardTestID} className="items-center">
                    <Animated.View layout={MOTION_LAYOUT} className="items-center">
                        <Animated.View key={pillContentKey} entering={MOTION_FADE_IN} exiting={MOTION_FADE_OUT} layout={MOTION_LAYOUT}>
                            {pillContent}
                        </Animated.View>
                    </Animated.View>
                </View>
            </Animated.View>
        </GestureDetector>
    );
};
