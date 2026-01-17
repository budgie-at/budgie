import { UserIconNameEnum } from '@budgie/contracts';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { CircularActionButton } from '../../../@generic/component/circular-action-button/circular-action-button';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useVoiceInput } from '../../hook/use-voice-input.hook';
import { AITransactionInterface } from '../../interface/ai-transaction.interface';
import { RecordButtonStateType } from '../../type/record-button-state.type';
import { AnimatedRecordButton } from '../animated-record-button/animated-record-button';
import { VoiceInputBubble } from '../voice-input-bubble/voice-input-bubble';
import { VoiceInputError } from '../voice-input-error/voice-input-error';

const EXIT_DURATION = 100;
const MIC_BOTTOM_OFFSET = -16;
const CLOSE_BUTTON_ROTATION = 45;

interface Props {
    readonly isOpen: boolean;
    readonly onClose: () => void;
}

const stateToButtonState: Record<string, RecordButtonStateType> = {
    idle: 'idle',
    recording: 'recording',
    transcribing: 'transcribing',
    confirming: 'confirm',
    processing: 'thinking',
    done: 'idle',
    error: 'idle'
};

// eslint-disable-next-line max-lines-per-function, max-statements
export const VoiceInputOverlay = ({ isOpen, onClose }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const { defaultAccount } = useSettingsContext();

    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const hasAutoStartedRef = useRef(false);
    const contentOpacity = useSharedValue(isOpen ? 1 : 0);

    const handleDone = (transaction: AITransactionInterface) => {
        const accountId = defaultAccount?.id;

        const params = new URLSearchParams();
        if (isPositiveNumber(transaction.amount)) {
            params.set('amount', String(transaction.amount));
        }
        if (isDefined(transaction.category)) {
            params.set('categoryId', String(transaction.category.id));
        }
        if (isDefined(accountId)) {
            params.set('accountId', String(accountId));
        }
        if (isNotEmptyString(transaction.comment)) {
            params.set('comment', transaction.comment);
        }

        onClose();
        router.push(`/create-transaction/expense?${params.toString()}`);
    };

    const voiceInput = useVoiceInput({ onDone: handleDone });

    useAnimatedReaction(
        () => isOpen,
        (current, previous) => {
            if (current && !previous) {
                contentOpacity.value = 1;
            } else if (!current && previous) {
                runOnJS(setIsAnimatingOut)(true);
                runOnJS(voiceInput.cancel)();
                contentOpacity.value = withTiming(0, { duration: EXIT_DURATION }, finished => {
                    if (finished) {
                        runOnJS(setIsAnimatingOut)(false);
                    }
                });
            }
        },
        [isOpen]
    );

    useEffect(() => {
        if (isOpen && voiceInput.isReady && !hasAutoStartedRef.current) {
            hasAutoStartedRef.current = true;
            voiceInput.start();
        }
        if (!isOpen) {
            hasAutoStartedRef.current = false;
        }
    }, [isOpen, voiceInput.isReady, voiceInput.start]);

    const handleRecord = () => {
        switch (voiceInput.state) {
            case 'recording':
                voiceInput.stop();
                break;
            case 'confirming':
                voiceInput.confirm();
                break;
            case 'idle':
            case 'error':
                voiceInput.start();
                break;
            default:
                break;
        }
    };

    const handleCancel = () => {
        voiceInput.cancel();
        onClose();
    };

    const handleDismissError = () => {
        voiceInput.retry();
    };

    const contentAnimatedStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));
    const closeButtonStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${CLOSE_BUTTON_ROTATION}deg` }] }));

    const isVisible = isOpen || isAnimatingOut;
    if (!isVisible) {
        return null;
    }

    const buttonState: RecordButtonStateType = voiceInput.isReady ? (stateToButtonState[voiceInput.state] ?? 'idle') : 'loading';

    const showBubble = voiceInput.state === 'recording' || voiceInput.state === 'transcribing' || voiceInput.state === 'confirming';
    const hasError = voiceInput.state === 'error' && isNotEmptyString(voiceInput.data.error);

    const micContainerStyle = { paddingBottom: bottom + MIC_BOTTOM_OFFSET };
    const closeContainerStyle = { paddingBottom: bottom };
    const containerStyle = [StyleSheet.absoluteFill, contentAnimatedStyle];

    return (
        <Animated.View style={containerStyle} pointerEvents="box-none">
            {hasError && <VoiceInputError message={voiceInput.data.error} onDismiss={handleDismissError} />}

            <View className="absolute inset-x-0 bottom-0 items-center pb-lg" style={micContainerStyle} pointerEvents="box-none">
                <VoiceInputBubble
                    isVisible={showBubble}
                    committedText={voiceInput.data.transcription.committed}
                    partialText={voiceInput.data.transcription.partial}
                />
                <AnimatedRecordButton
                    state={buttonState}
                    audioLevel={voiceInput.data.audioLevel}
                    downloadProgress={voiceInput.downloadProgress}
                    onPress={handleRecord}
                />
            </View>

            <View className="absolute right-0 bottom-0 px-lg" style={closeContainerStyle} pointerEvents="box-none">
                <CircularActionButton icon={UserIconNameEnum.Plus} onPress={handleCancel} animatedStyle={closeButtonStyle} />
            </View>
        </Animated.View>
    );
};
