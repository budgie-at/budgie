import { UserIconNameEnum } from '@budgie/contracts';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, FadeIn, withRepeat, withTiming } from 'react-native-reanimated';
import { ScopedTheme } from 'uniwind';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { MOTION_FAST_DURATION, EASE_OUT } from '../../../@generic/constant/motion.constant';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { AUDIO_LEVEL_TRACK_DURATION, BUTTON_SIZE, RING_SIZE } from '../../constant/animated-record-button.constant';
import { RecordButtonStateType } from '../../type/record-button-state.type';
import { LoadingRing } from '../loading-ring/loading-ring';
import { PulseRing } from '../pulse-ring/pulse-ring';
import { SpinnerRing } from '../spinner-ring/spinner-ring';
import { ThinkingRing } from '../thinking-ring/thinking-ring';

interface Props {
    readonly state: RecordButtonStateType;
    readonly audioLevel?: number;
    readonly downloadProgress?: number;
    readonly onPress: () => void;
    readonly disabled?: boolean;
    readonly testID?: string;
}

const ICON_SIZE = 32;
const AUDIO_THRESHOLD = 0.05;
const SCALE_MULTIPLIER = 0.1;
const CONFIRM_PULSE_DURATION = 1200;
const CONFIRM_PULSE_MAX_SCALE = 1.05;
const SETTLE_DURATION = 200;

const iconEntering = FadeIn.duration(MOTION_FAST_DURATION).easing(EASE_OUT);

const BUTTON_COLOR_CLASS_NAME: Record<RecordButtonStateType, string> = {
    idle: 'bg-default-foreground',
    loading: 'bg-secondary-foreground',
    recording: 'bg-destructive-foreground',
    transcribing: 'bg-default-foreground',
    confirm: 'bg-positive-foreground',
    thinking: 'bg-default-foreground'
};

const PRESS_FEEDBACK: Record<RecordButtonStateType, HapticPressFeedbackEnum> = {
    idle: HapticPressFeedbackEnum.COMMIT,
    loading: HapticPressFeedbackEnum.NONE,
    recording: HapticPressFeedbackEnum.IMPACT,
    transcribing: HapticPressFeedbackEnum.NONE,
    confirm: HapticPressFeedbackEnum.COMMIT,
    thinking: HapticPressFeedbackEnum.NONE
};

const getIcon = (state: RecordButtonStateType): UserIconNameEnum => {
    switch (state) {
        case 'recording':
            return UserIconNameEnum.Square;
        case 'transcribing':
        case 'thinking':
            return UserIconNameEnum.Sparkles;
        case 'confirm':
            return UserIconNameEnum.Check;
        case 'idle':
        case 'loading':
        default:
            return UserIconNameEnum.Mic;
    }
};

export const AnimatedRecordButton = (props: Props) => {
    const { state, audioLevel = 0, downloadProgress = 0, onPress, disabled, testID } = props;

    const reducedMotion = useReducedMotion();
    const buttonScale = useSharedValue(1);
    const confirmPulse = useSharedValue(0);

    useEffect(() => {
        if (state === 'recording' && audioLevel > AUDIO_THRESHOLD) {
            buttonScale.set(withTiming(1 + audioLevel * SCALE_MULTIPLIER, { duration: AUDIO_LEVEL_TRACK_DURATION, easing: EASE_OUT }));
        } else if (state === 'confirm') {
            buttonScale.set(withTiming(1, { duration: SETTLE_DURATION, easing: EASE_OUT }));
            confirmPulse.set(
                reducedMotion
                    ? 0
                    : withRepeat(withTiming(1, { duration: CONFIRM_PULSE_DURATION, easing: Easing.inOut(Easing.sin) }), -1, true)
            );
        } else {
            buttonScale.set(withTiming(1, { duration: SETTLE_DURATION, easing: EASE_OUT }));
            confirmPulse.set(0);
        }
    }, [audioLevel, buttonScale, confirmPulse, reducedMotion, state]);

    const buttonAnimatedStyle = useAnimatedStyle(() => {
        const pulseScale = state === 'confirm' ? interpolate(confirmPulse.get(), [0, 1], [1, CONFIRM_PULSE_MAX_SCALE]) : 1;

        return {
            borderRadius: BUTTON_SIZE / 2,
            height: BUTTON_SIZE,
            width: BUTTON_SIZE,
            transform: [{ scale: buttonScale.get() * pulseScale }]
        };
    });

    const isDisabled = disabled ?? (state === 'loading' || state === 'transcribing' || state === 'thinking');
    const containerStyle = { height: RING_SIZE, width: RING_SIZE };

    return (
        <ScopedTheme theme="light">
            <View className="items-center justify-center" style={containerStyle}>
                {state === 'loading' && <LoadingRing progress={downloadProgress} />}
                {state === 'recording' && (
                    <>
                        <PulseRing index={0} audioLevel={audioLevel} />
                        <PulseRing index={1} audioLevel={audioLevel} />
                        <PulseRing index={2} audioLevel={audioLevel} />
                    </>
                )}
                {state === 'transcribing' && <SpinnerRing />}
                {state === 'thinking' && <ThinkingRing />}

                <HapticPressable disabled={isDisabled} onPress={onPress} pressFeedback={PRESS_FEEDBACK[state]} testID={testID}>
                    <Animated.View
                        className={cn('items-center justify-center', BUTTON_COLOR_CLASS_NAME[state])}
                        style={buttonAnimatedStyle}
                    >
                        <Animated.View key={state} entering={iconEntering}>
                            <Icon icon={getIcon(state)} size={ICON_SIZE} className="text-white" />
                        </Animated.View>
                    </Animated.View>
                </HapticPressable>
            </View>
        </ScopedTheme>
    );
};
