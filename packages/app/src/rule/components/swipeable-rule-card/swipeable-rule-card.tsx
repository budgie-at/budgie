import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { ReactNode, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';

const ENTRY_SPRING_CONFIG = { damping: 20, stiffness: 80 };
const SWIPE_THRESHOLD = 80;
const ENTRY_TRANSLATE_Y = 16;
const SNAP_BACK_SPRING_CONFIG = { damping: 20, stiffness: 200 };
const SLIDE_OUT_DISTANCE = 300;
const ZAP_ICON_SIZE = 14;
const CHECK_ICON_SIZE = 14;
const SUCCESS_AUTO_DISMISS_MS = 2000;
const ERROR_AUTO_DISMISS_MS = 3000;

type CardStatus = 'idle' | 'creating' | 'success' | 'error';
type CardLayout = 'compact' | 'wide';

const cardVariants = cva('flex-row items-center gap-sm px-lg py-sm bg-ghost-background rounded-xl shadow-sm', {
    variants: {
        layout: {
            compact: 'self-start',
            wide: 'max-w-[85%]'
        }
    },
    defaultVariants: {
        layout: 'compact'
    }
});

export interface SwipeableRuleCardResultInterface {
    readonly applied: number;
}

interface Props {
    readonly descriptionText: string;
    readonly successMessage: (appliedCount: number) => ReactNode;
    readonly errorMessage: ReactNode;
    readonly cardTestID?: string;
    readonly buttonTestID?: string;
    readonly layout?: CardLayout;
    readonly onYes: () => Promise<SwipeableRuleCardResultInterface>;
    readonly onComplete: () => void;
    readonly onDismiss: () => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements -- Shared card component with gesture handling, animations, and multiple render states
export const SwipeableRuleCard = (props: Props) => {
    const {
        descriptionText,
        successMessage,
        errorMessage,
        cardTestID,
        buttonTestID,
        layout = 'compact',
        onYes,
        onComplete,
        onDismiss
    } = props;

    const [status, setStatus] = useState<CardStatus>('idle');
    const [appliedCount, setAppliedCount] = useState(0);
    const [hapticNotification, hapticImpact] = useVibration();

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(ENTRY_TRANSLATE_Y);
    const opacity = useSharedValue(0);

    translateY.value = withSpring(0, ENTRY_SPRING_CONFIG);
    opacity.value = withSpring(1, ENTRY_SPRING_CONFIG);

    const handleSwipeThresholdReached = () => {
        hapticImpact(ImpactFeedbackStyle.Light);
    };

    const panGesture = Gesture.Pan()
        .activeOffsetX(10)
        .onUpdate(event => {
            const clampedTranslation = Math.max(0, event.translationX);
            translateX.value = clampedTranslation;

            if (clampedTranslation >= SWIPE_THRESHOLD) {
                runOnJS(handleSwipeThresholdReached)();
            }
        })
        .onEnd(event => {
            if (event.translationX >= SWIPE_THRESHOLD) {
                translateX.value = withSpring(SLIDE_OUT_DISTANCE, SNAP_BACK_SPRING_CONFIG);
                opacity.value = withSpring(0, SNAP_BACK_SPRING_CONFIG);
                runOnJS(onDismiss)();
            } else {
                translateX.value = withSpring(0, SNAP_BACK_SPRING_CONFIG);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
        opacity: opacity.value
    }));

    const handleYesPress = async () => {
        setStatus('creating');

        try {
            const result = await onYes();
            setAppliedCount(result.applied);
            setStatus('success');
            hapticNotification(NotificationFeedbackType.Success);
            setTimeout(onComplete, SUCCESS_AUTO_DISMISS_MS);
        } catch {
            setStatus('error');
            setTimeout(onDismiss, ERROR_AUTO_DISMISS_MS);
        }
    };

    const handleYesButtonPress = () => void handleYesPress();

    if (status === 'success') {
        return (
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)}>
                <View className="flex-row items-center gap-xs px-lg py-sm bg-ghost-background rounded-xl shadow-sm">
                    <Icon icon={UserIconNameEnum.CircleCheck} size={CHECK_ICON_SIZE} className="text-positive-foreground" />
                    <Text className="text-xs text-secondary-foreground font-medium">{successMessage(appliedCount)}</Text>
                </View>
            </Animated.View>
        );
    }

    if (status === 'error') {
        return (
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)}>
                <View className="flex-row items-center gap-xs px-lg py-sm bg-ghost-background rounded-xl shadow-sm">
                    <Icon icon={UserIconNameEnum.CircleAlert} size={CHECK_ICON_SIZE} className="text-destructive-foreground" />
                    <Text className="text-xs text-destructive-foreground font-medium">{errorMessage}</Text>
                </View>
            </Animated.View>
        );
    }

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={animatedStyle}>
                <View testID={cardTestID} className={cardVariants({ layout })}>
                    <Icon icon={UserIconNameEnum.Zap} size={ZAP_ICON_SIZE} className="text-secondary-foreground" />
                    <Text className="text-xs text-secondary-foreground font-medium shrink">{descriptionText}</Text>
                    {status === 'creating' ? (
                        <ActivityIndicator size="small" />
                    ) : (
                        <HapticPressable testID={buttonTestID} onPress={handleYesButtonPress} className="px-md py-xs bg-primary rounded-lg">
                            <Text className="text-xs text-primary-reverse font-semibold">
                                <Trans>Yes</Trans>
                            </Text>
                        </HapticPressable>
                    )}
                </View>
            </Animated.View>
        </GestureDetector>
    );
};
