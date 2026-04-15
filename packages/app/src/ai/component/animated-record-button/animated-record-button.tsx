import { UserIconNameEnum } from '@budgie/contracts';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming
} from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import {
    ACCENT_COLOR,
    BUTTON_SIZE,
    CONFIRM_COLOR,
    LOADING_COLOR,
    RECORDING_COLOR,
    RING_SIZE
} from '../../constant/animated-record-button.constant';
import { RecordButtonStateType } from '../../type/record-button-state-type.type';
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
}

const ICON_SIZE = 32;
const AUDIO_THRESHOLD = 0.05;
const SCALE_MULTIPLIER = 0.1;
const CONFIRM_PULSE_DURATION = 1200;
const CONFIRM_PULSE_MAX_SCALE = 1.05;

const getButtonColor = (state: RecordButtonStateType): string => {
    'worklet';

    switch (state) {
        case 'recording':
            return RECORDING_COLOR;
        case 'loading':
            return LOADING_COLOR;
        case 'confirm':
            return CONFIRM_COLOR;
        default:
            return ACCENT_COLOR;
    }
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
        default:
            return UserIconNameEnum.Mic;
    }
};

export const AnimatedRecordButton = (props: Props) => {
    const { state, audioLevel = 0, downloadProgress = 0, onPress, disabled } = props;

    const buttonScale = useSharedValue(1);
    const confirmPulse = useSharedValue(0);

    useEffect(() => {
        if (state === 'recording' && audioLevel > AUDIO_THRESHOLD) {
            buttonScale.set(withSpring(1 + audioLevel * SCALE_MULTIPLIER, { damping: 15 }));
        } else if (state === 'confirm') {
            buttonScale.set(withSpring(1, { damping: 15 }));
            confirmPulse.set(withRepeat(withTiming(1, { duration: CONFIRM_PULSE_DURATION, easing: Easing.inOut(Easing.ease) }), -1, true));
        } else {
            buttonScale.set(withSpring(1, { damping: 15 }));
            confirmPulse.set(0);
        }
    }, [audioLevel, buttonScale, confirmPulse, state]);

    const buttonAnimatedStyle = useAnimatedStyle(() => {
        const pulseScale = state === 'confirm' ? interpolate(confirmPulse.value, [0, 1], [1, CONFIRM_PULSE_MAX_SCALE]) : 1;

        return {
            backgroundColor: getButtonColor(state),
            borderRadius: BUTTON_SIZE / 2,
            height: BUTTON_SIZE,
            width: BUTTON_SIZE,
            transform: [{ scale: buttonScale.value * pulseScale }]
        };
    });

    const isDisabled = disabled ?? (state === 'loading' || state === 'transcribing' || state === 'thinking');
    const containerStyle = { height: RING_SIZE, width: RING_SIZE };

    return (
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

            <HapticPressable disabled={isDisabled} onPress={onPress}>
                <Animated.View className="items-center justify-center" style={buttonAnimatedStyle}>
                    <Icon icon={getIcon(state)} size={ICON_SIZE} className="text-white" />
                </Animated.View>
            </HapticPressable>
        </View>
    );
};
