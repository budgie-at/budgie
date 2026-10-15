import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { AccessibilityActionEvent, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { EmptyFn } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Icon } from '../../../@generic/component/icon/icon';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';

const HOLD_DURATION_MS = 1200;
const RELEASE_DURATION_MS = 200;
const TICK_COUNT = 4;
const ACCESSIBILITY_ACTIVATE = 'activate';
const ACCESSIBILITY_ACTIONS = [{ name: ACCESSIBILITY_ACTIVATE }];

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

    const handleConfirmPress = async () => {
        const isConfirmed = await confirmAlert({ title: label, message: confirmMessage, confirmText: t`Seal`, cancelText: t`Cancel` });

        if (isConfirmed) {
            onComplete();
        }
    };

    const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
        if (event.nativeEvent.actionName === ACCESSIBILITY_ACTIVATE) {
            void handleConfirmPress();
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

    const fillStyle = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));
    const accessibilityState = { disabled: isDisabled };

    if (reducedMotion) {
        return (
            <Button
                testID={testID}
                variant="cta"
                leftIcon={UserIconNameEnum.Lock}
                content={label}
                disabled={isDisabled}
                onPress={handleConfirmPress}
            />
        );
    }

    return (
        <GestureDetector gesture={holdGesture}>
            <View
                testID={testID}
                accessible
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityHint={t`Press and hold to seal`}
                accessibilityState={accessibilityState}
                accessibilityActions={ACCESSIBILITY_ACTIONS}
                onAccessibilityAction={handleAccessibilityAction}
                className="overflow-hidden rounded-3xl border border-cta-corner bg-cta-background"
            >
                <Animated.View style={fillStyle} className="absolute inset-y-0 left-0 bg-positive-foreground/40" />

                <View className="flex-row items-center justify-center gap-x-md py-3xl">
                    <Icon icon={UserIconNameEnum.Lock} size={16} className="text-cta-foreground" />
                    <Text className="text-cta-foreground text-md font-semibold">{label}</Text>
                </View>
            </View>
        </GestureDetector>
    );
};
