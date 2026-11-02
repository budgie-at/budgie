import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { AccessibilityActionEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Easing, runOnJS, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';

import { EmptyFn } from '@rnw-community/shared';

import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { OnboardingHoldToSealFill } from '../onboarding-hold-to-seal-fill/onboarding-hold-to-seal-fill';
import { OnboardingHoldToSealLabel } from '../onboarding-hold-to-seal-label/onboarding-hold-to-seal-label';

const HOLD_DURATION_MS = 1200;
const RELEASE_DURATION_MS = 200;
const TICK_COUNT = 4;
const ACCESSIBILITY_ACTIVATE = 'activate';
const ACCESSIBILITY_ACTIONS = [{ name: ACCESSIBILITY_ACTIVATE }];
const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

interface Props {
    readonly label: string;
    readonly confirmMessage: string;
    readonly isDisabled: boolean;
    readonly onComplete: EmptyFn;
    readonly testID?: string;
}

export const OnboardingHoldToSealButton = ({ label, confirmMessage, isDisabled, onComplete, testID }: Props) => {
    const { t } = useLingui();

    const progress = useSharedValue(0);

    const reducedMotion = useReducedMotion();
    const [, hapticImpact] = useVibration();

    const handleTick = () => void hapticImpact(ImpactFeedbackStyle.Soft);

    const handleConfirmPress = () => {
        appRuntime.runFork(
            Effect.gen(function* () {
                const isConfirmed = yield* confirmAlert({
                    title: label,
                    message: confirmMessage,
                    confirmText: t`Seal`,
                    cancelText: t`Cancel`
                });

                if (isConfirmed) {
                    onComplete();
                }
            })
        );
    };

    const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
        if (event.nativeEvent.actionName === ACCESSIBILITY_ACTIVATE) {
            handleConfirmPress();
        }
    };

    useAnimatedReaction(
        () => Math.floor(progress.get() * TICK_COUNT),
        (currentTick, previousTick) => {
            if (currentTick > (previousTick ?? currentTick) && currentTick < TICK_COUNT) {
                runOnJS(handleTick)();
            }
        }
    );

    const holdGesture = Gesture.LongPress()
        .enabled(!isDisabled)
        .minDuration(HOLD_DURATION_MS)
        .maxDistance(40)
        .onBegin(() => {
            progress.set(withTiming(1, { duration: HOLD_DURATION_MS, easing: Easing.linear }));
        })
        .onStart(() => {
            runOnJS(onComplete)();
        })
        .onFinalize((_event, isSuccess) => {
            if (!isSuccess) {
                progress.set(withTiming(0, { duration: RELEASE_DURATION_MS }));
            }
        });

    const tapGesture = Gesture.Tap()
        .enabled(!isDisabled)
        .onEnd(() => {
            runOnJS(handleConfirmPress)();
        });

    const accessibilityState = { disabled: isDisabled, busy: isDisabled };
    const gesture = reducedMotion ? tapGesture : holdGesture;
    const accessibilityHint = reducedMotion ? t`Double-tap to seal` : t`Press and hold to seal`;
    const visibleLabel = reducedMotion ? t`Seal with this PIN` : label;

    return (
        <GestureDetector gesture={gesture}>
            <View
                testID={testID}
                accessible
                accessibilityRole="button"
                accessibilityLabel={visibleLabel}
                accessibilityHint={accessibilityHint}
                accessibilityState={accessibilityState}
                accessibilityActions={ACCESSIBILITY_ACTIONS}
                onAccessibilityAction={handleAccessibilityAction}
                className="min-h-[52px] justify-center overflow-hidden rounded-full bg-cta-background px-5xl py-md"
                style={CONTINUOUS_CORNERS}
            >
                <OnboardingHoldToSealLabel label={visibleLabel} isLoading={isDisabled} colorClassName="text-cta-foreground" />
                <OnboardingHoldToSealFill label={visibleLabel} isLoading={isDisabled} progress={progress} />
                <View
                    pointerEvents="none"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    className="absolute inset-0 rounded-full border-[1.5px] border-cta-background"
                    style={CONTINUOUS_CORNERS}
                />
            </View>
        </GestureDetector>
    );
};
