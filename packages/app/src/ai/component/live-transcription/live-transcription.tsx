import { Trans } from '@lingui/react/macro';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { isNotEmptyString } from '@rnw-community/shared';

import { TranscribeStatus } from '../../hook/use-streaming-transcribe.hook';

interface Props {
    readonly committed: string;
    readonly partial: string;
    readonly status: TranscribeStatus;
    readonly isVoiceDetected: boolean;
}

const INITIAL_SCALE = 0.95;
const ANIMATION_DURATION_IN = 200;
const ANIMATION_DURATION_OUT = 150;

export const LiveTranscription = ({ committed, partial, status, isVoiceDetected }: Props) => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(INITIAL_SCALE);

    const hasText = isNotEmptyString(committed) || isNotEmptyString(partial);
    const isRecording = status === 'recording';
    const isProcessing = status === 'processing';

    useEffect(() => {
        if (hasText || isRecording || isProcessing) {
            opacity.value = withTiming(1, { duration: ANIMATION_DURATION_IN });
            scale.value = withSpring(1, { damping: 15 });
        } else {
            opacity.value = withTiming(0, { duration: ANIMATION_DURATION_OUT });
            scale.value = withTiming(INITIAL_SCALE, { duration: ANIMATION_DURATION_OUT });
        }
    }, [hasText, isProcessing, isRecording, opacity, scale]);

    const animatedContainerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }]
    }));

    if (!hasText && !isRecording && !isProcessing) {
        return null;
    }

    const getStatusMessage = () => {
        if (isProcessing) {
            return <Trans>Transcribing...</Trans>;
        }
        if (isVoiceDetected) {
            return <Trans>Speaking...</Trans>;
        }

        return <Trans>Listening...</Trans>;
    };

    return (
        <Animated.View className="mt-4 p-4 bg-secondary rounded-2xl" style={animatedContainerStyle}>
            <Text className="text-secondary text-sm font-medium mb-2">
                <Trans>Your message:</Trans>
            </Text>
            <View className="flex-row flex-wrap">
                {isNotEmptyString(committed) && <Text className="text-primary text-base">{committed}</Text>}
                {isNotEmptyString(partial) && (
                    <Text className="text-secondary-foreground text-base italic">{partial}</Text>
                )}
                {!hasText && (
                    <Text className="text-secondary-foreground text-base italic">{getStatusMessage()}</Text>
                )}
            </View>
        </Animated.View>
    );
};
