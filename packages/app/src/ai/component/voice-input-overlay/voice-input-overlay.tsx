import { UserIconNameEnum } from '@budgie/contracts';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { CircularActionButton } from '../../../@generic/component/circular-action-button/circular-action-button';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useLlmContext } from '../../context/llm.context';
import { useAiTransaction } from '../../hook/use-ai-transaction.hook';
import { useLlmGeneration } from '../../hook/use-llm-generation.hook';
import { useStreamingTranscribe } from '../../hook/use-streaming-transcribe.hook';
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

// eslint-disable-next-line max-lines-per-function,max-statements
export const VoiceInputOverlay = ({ isOpen, onClose }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const { llm, stt } = useLlmContext();
    const { defaultAccount } = useSettingsContext();

    const [finalPrompt, setFinalPrompt] = useState('');
    const [userConfirmed, setUserConfirmed] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const hasAutoStartedRef = useRef(false);

    const isOpenShared = useSharedValue(isOpen);
    const contentOpacity = useSharedValue(isOpen ? 1 : 0);

    const handleExitComplete = () => {
        setIsAnimatingOut(false);
    };

    useDerivedValue(() => {
        isOpenShared.value = isOpen;
    }, [isOpen]);

    useAnimatedReaction(
        () => isOpenShared.value,
        (current, previous) => {
            if (current && !previous) {
                contentOpacity.value = 1;
            } else if (!current && previous) {
                runOnJS(setIsAnimatingOut)(true);
                contentOpacity.value = withTiming(0, { duration: EXIT_DURATION }, finished => {
                    if (finished) {
                        runOnJS(handleExitComplete)();
                    }
                });
            }
        },
        [isOpen]
    );

    const contentAnimatedStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

    const [systemPrompt, transactionInfo, resetTransaction] = useAiTransaction(llm, finalPrompt);
    const { generateFromTranscription, error, clearError } = useLlmGeneration(llm, systemPrompt);

    const handleTranscriptionComplete = (transcribed: string) => {
        setFinalPrompt(transcribed);
    };

    const { startRecording, stopRecording, status, transcription, audioLevel } = useStreamingTranscribe(handleTranscriptionComplete);

    const isReady = llm.isReady && stt.isReady;
    const hasValidTransaction = isDefined(transactionInfo) && isPositiveNumber(transactionInfo.amount);
    const hasTranscription = isNotEmptyString(finalPrompt);
    const isConfirmPhase = status === 'idle' && hasTranscription && !userConfirmed;

    const handleReset = () => {
        clearError();
        setFinalPrompt('');
        resetTransaction();
        setUserConfirmed(false);
    };

    const handleCancel = () => {
        handleReset();
        onClose();
    };

    useEffect(() => {
        if (isOpen) {
            clearError();
            if (isReady && !hasAutoStartedRef.current) {
                hasAutoStartedRef.current = true;
                startRecording();
            }
        } else {
            hasAutoStartedRef.current = false;
        }
    }, [isOpen, isReady, startRecording, clearError]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        return () => {
            setFinalPrompt('');
            resetTransaction();
            setUserConfirmed(false);
        };
    }, [isOpen, resetTransaction]);

    useEffect(() => {
        if (isNotEmptyString(finalPrompt)) {
            void generateFromTranscription(finalPrompt);
        }
    }, [finalPrompt, generateFromTranscription]);

    useEffect(() => {
        if (userConfirmed && hasValidTransaction) {
            const accountId = defaultAccount?.id;
            const params = new URLSearchParams();
            params.set('amount', String(transactionInfo.amount));
            if (isDefined(transactionInfo.category)) {
                params.set('categoryId', String(transactionInfo.category.id));
            }
            if (isDefined(accountId)) {
                params.set('accountId', String(accountId));
            }
            if (isNotEmptyString(transactionInfo.comment)) {
                params.set('comment', transactionInfo.comment);
            }
            onClose();
            router.push(`/create-transaction/expense?${params.toString()}`);
        }
    }, [userConfirmed, hasValidTransaction, transactionInfo, defaultAccount, onClose]);

    const handleUserConfirm = () => {
        setUserConfirmed(true);
    };

    const handleRecord = () => {
        if (status === 'recording') {
            stopRecording();
        } else if (isConfirmPhase) {
            handleUserConfirm();
        } else {
            handleReset();
            startRecording();
        }
    };

    const handleDismissError = () => {
        clearError();
        startRecording();
    };

    const getButtonState = (): RecordButtonStateType => {
        if (!isReady) {
            return 'loading';
        }
        if (status === 'recording') {
            return 'recording';
        }
        if (status === 'processing') {
            return 'transcribing';
        }
        if (isConfirmPhase) {
            return 'confirm';
        }
        if (userConfirmed && !hasValidTransaction) {
            return 'thinking';
        }

        return 'idle';
    };

    const closeButtonStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${CLOSE_BUTTON_ROTATION}deg` }]
    }));

    const isVisible = isOpen || isAnimatingOut;

    if (!isVisible) {
        return null;
    }

    const downloadProgress = Math.min(llm.downloadProgress, stt.downloadProgress);
    const showBubble = status === 'recording' || status === 'processing' || isConfirmPhase;
    const buttonState = getButtonState();
    const micContainerStyle = { paddingBottom: bottom + MIC_BOTTOM_OFFSET };
    const closeContainerStyle = { paddingBottom: bottom };
    const hasError = isNotEmptyString(error);
    const containerStyle = [StyleSheet.absoluteFill, contentAnimatedStyle];

    return (
        <Animated.View style={containerStyle} pointerEvents="box-none">
            {hasError && <VoiceInputError message={error} onDismiss={handleDismissError} />}

            <View className="absolute inset-x-0 bottom-0 items-center pb-lg" style={micContainerStyle} pointerEvents="box-none">
                <VoiceInputBubble isVisible={showBubble} committedText={transcription.committed} partialText={transcription.partial} />
                <AnimatedRecordButton
                    state={buttonState}
                    audioLevel={audioLevel}
                    downloadProgress={downloadProgress}
                    onPress={handleRecord}
                />
            </View>

            <View className="absolute right-0 bottom-0 px-lg" style={closeContainerStyle} pointerEvents="box-none">
                <CircularActionButton icon={UserIconNameEnum.Plus} onPress={handleCancel} animatedStyle={closeButtonStyle} />
            </View>
        </Animated.View>
    );
};
