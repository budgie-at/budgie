import { UserIconNameEnum } from '@budgie/contracts';
import { getLogger } from '@budgie/logger';
import { cva } from 'class-variance-authority';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { getErrorMessage } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { SwipeableRuleCardStatus } from '../swipeable-rule-card-status/swipeable-rule-card-status';

const logger = getLogger('SwipeableRuleCard');

const ENTRY_SPRING_CONFIG = { damping: 20, stiffness: 80 };
const SWIPE_THRESHOLD = 80;
const ENTRY_TRANSLATE_Y = 16;
const SNAP_BACK_SPRING_CONFIG = { damping: 20, stiffness: 200 };
const SLIDE_OUT_DISTANCE = 300;
const ZAP_ICON_SIZE = 14;
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
    const didTriggerThresholdHaptic = useSharedValue(false);

    useEffect(() => {
        translateY.value = withSpring(0, ENTRY_SPRING_CONFIG);
        opacity.value = withSpring(1, ENTRY_SPRING_CONFIG);
    }, [opacity, translateY]);

    const handleSwipeThresholdReached = () => {
        hapticImpact(ImpactFeedbackStyle.Light);
    };

    const panGesture = Gesture.Pan()
        .activeOffsetX(10)
        .onUpdate(event => {
            const clampedTranslation = Math.max(0, event.translationX);
            translateX.value = clampedTranslation;

            if (clampedTranslation >= SWIPE_THRESHOLD) {
                if (!didTriggerThresholdHaptic.value) {
                    didTriggerThresholdHaptic.value = true;
                    runOnJS(handleSwipeThresholdReached)();
                }
            } else {
                didTriggerThresholdHaptic.value = false;
            }
        })
        .onEnd(event => {
            didTriggerThresholdHaptic.value = false;

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
        logger.log('handleYesPress:enter');
        setStatus('creating');

        try {
            const result = await onYes();
            logger.log('handleYesPress:onYes:done', { applied: result.applied });
            setAppliedCount(result.applied);
            setStatus('success');
            hapticNotification(NotificationFeedbackType.Success);
            setTimeout(onComplete, SUCCESS_AUTO_DISMISS_MS);
        } catch (error) {
            logger.error('handleYesPress:onYes:throw', { errorMessage: getErrorMessage(error) });
            setStatus('error');
            setTimeout(onDismiss, ERROR_AUTO_DISMISS_MS);
        }
    };

    const handleYesButtonPress = () => {
        logger.log('handleYesButtonPress:fired');
        void handleYesPress();
    };

    if (status === 'success') {
        return (
            <SwipeableRuleCardStatus
                icon={UserIconNameEnum.CircleCheck}
                iconClassName="text-positive-foreground"
                textClassName="text-xs text-secondary-foreground font-medium"
            >
                {successMessage(appliedCount)}
            </SwipeableRuleCardStatus>
        );
    }

    if (status === 'error') {
        return (
            <SwipeableRuleCardStatus
                icon={UserIconNameEnum.CircleAlert}
                iconClassName="text-destructive-foreground"
                textClassName="text-xs text-destructive-foreground font-medium"
            >
                {errorMessage}
            </SwipeableRuleCardStatus>
        );
    }

    const isCreating = status === 'creating';

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={animatedStyle}>
                <View testID={cardTestID}>
                    <HapticPressable
                        testID={buttonTestID}
                        onPress={handleYesButtonPress}
                        disabled={isCreating}
                        className={cardVariants({ layout })}
                    >
                        <Icon icon={UserIconNameEnum.Zap} size={ZAP_ICON_SIZE} className="text-secondary-foreground" />
                        <Text className="text-xs text-secondary-foreground font-medium shrink">{descriptionText}</Text>
                        {isCreating ? <ActivityIndicator size="small" /> : null}
                    </HapticPressable>
                </View>
            </Animated.View>
        </GestureDetector>
    );
};
