import { UserIconNameEnum } from '@budgie/contracts';
import { getLogger } from '@budgie/logger';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { ReactNode, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    FadeIn,
    FadeOut,
    LinearTransition,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

import { getErrorMessage } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { RuleIndicatorPill } from '../rule-indicator-pill/rule-indicator-pill';

const logger = getLogger('SwipeableRuleCard');

const ENTRY_SPRING_CONFIG = { damping: 20, stiffness: 80 };
const SWIPE_THRESHOLD = 80;
const ENTRY_TRANSLATE_Y = 16;
const SNAP_BACK_SPRING_CONFIG = { damping: 20, stiffness: 200 };
const SLIDE_OUT_DISTANCE = 300;
const SUCCESS_AUTO_DISMISS_MS = 2000;
const ERROR_AUTO_DISMISS_MS = 3000;
const PILL_LAYOUT_ANIMATION_MS = 180;
const PILL_CONTENT_ENTER_MS = 120;
const PILL_CONTENT_EXIT_MS = 90;
const PILL_LAYOUT_TRANSITION = LinearTransition.duration(PILL_LAYOUT_ANIMATION_MS);
const PILL_CONTENT_ENTERING = FadeIn.duration(PILL_CONTENT_ENTER_MS);
const PILL_CONTENT_EXITING = FadeOut.duration(PILL_CONTENT_EXIT_MS);

type CardStatus = 'idle' | 'creating' | 'success' | 'error';
type CardLayout = 'compact' | 'wide';

interface Props {
    readonly descriptionText: string;
    readonly successMessage: ReactNode;
    readonly errorMessage: ReactNode;
    readonly cardTestID?: string;
    readonly buttonTestID?: string;
    readonly layout?: CardLayout;
    readonly onYes: () => Promise<void>;
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

    const isSuccess = status === 'success';
    const isError = status === 'error';
    const isStatus = isSuccess || isError;
    const isCreating = status === 'creating';
    const isInteractive = !isStatus;

    const panGesture = Gesture.Pan()
        .enabled(isInteractive)
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
            await onYes();
            logger.log('handleYesPress:onYes:done');
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

    const isWideLayout = layout === 'wide';
    const trailingContent = isCreating ? <ActivityIndicator size="small" /> : null;
    const cardClassName = isWideLayout ? 'items-center' : 'items-start';
    const buttonClassName = isWideLayout ? 'self-center' : 'self-start max-w-[85%]';
    const pillClassName = isWideLayout ? 'self-center' : 'self-start';
    const pillTextProps = isWideLayout ? { textClassName: 'shrink-0' } : {};
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
        <HapticPressable testID={buttonTestID} onPress={handleYesButtonPress} disabled={isCreating} className={buttonClassName}>
            <RuleIndicatorPill icon={UserIconNameEnum.Zap} className={pillClassName} trailingContent={trailingContent} {...pillTextProps}>
                {descriptionText}
            </RuleIndicatorPill>
        </HapticPressable>
    );

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View style={animatedStyle}>
                <View testID={cardTestID} className={cardClassName}>
                    <Animated.View layout={PILL_LAYOUT_TRANSITION} className="items-center">
                        <Animated.View
                            key={pillContentKey}
                            entering={PILL_CONTENT_ENTERING}
                            exiting={PILL_CONTENT_EXITING}
                            layout={PILL_LAYOUT_TRANSITION}
                        >
                            {pillContent}
                        </Animated.View>
                    </Animated.View>
                </View>
            </Animated.View>
        </GestureDetector>
    );
};
