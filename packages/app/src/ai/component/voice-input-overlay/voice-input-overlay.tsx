import { UserIconNameEnum } from '@budgie/contracts';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    runOnJS,
    useAnimatedReaction,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { AiTransactionPreviewCard } from '../../../transaction/components/ai-transaction-preview-card/ai-transaction-preview-card';
import { useCreateExpenseTransactionMutation } from '../../../transaction/hook/use-create-expense-transaction.mutation';
import { useLlmContext } from '../../context/llm.context';
import { useAiTransaction } from '../../hook/use-ai-transaction.hook';
import { useLlmGeneration } from '../../hook/use-llm-generation.hook';
import { useStreamingTranscribe } from '../../hook/use-streaming-transcribe.hook';
import { RecordButtonStateType } from '../../type/record-button-state.type';
import { AnimatedRecordButton } from '../animated-record-button/animated-record-button';
import { VoiceInputBubble } from '../voice-input-bubble/voice-input-bubble';
import { VoiceInputError } from '../voice-input-error/voice-input-error';

const FADE_DURATION = 200;
const OVERLAY_OPACITY = 0.85;
const CLOSE_ICON_SIZE = 32;
const MIC_BOTTOM_OFFSET = -16;

interface Props {
    readonly isOpen: boolean;
    readonly onClose: () => void;
}

// eslint-disable-next-line max-lines-per-function,max-statements
export const VoiceInputOverlay = ({ isOpen, onClose }: Props) => {
    const { bottom } = useSafeAreaInsets();
    const { llm, stt } = useLlmContext();
    const { defaultAccount } = useSettingsContext();
    const createExpense = useCreateExpenseTransactionMutation();

    const [finalPrompt, setFinalPrompt] = useState('');
    const [accountId, setAccountId] = useState<number | null>(null);
    const [userConfirmed, setUserConfirmed] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const hasAutoStartedRef = useRef(false);

    const [systemPrompt, transactionInfo, resetTransaction, setTransactionCategory] = useAiTransaction(llm, finalPrompt);
    const { generateFromTranscription, error, clearError } = useLlmGeneration(llm, systemPrompt);

    const handleTranscriptionComplete = async (transcribed: string) => {
        setFinalPrompt(transcribed);
        await generateFromTranscription(transcribed);
    };

    const { startRecording, stopRecording, status, transcription, audioLevel } = useStreamingTranscribe(handleTranscriptionComplete);

    const isReady = llm.isReady && stt.isReady;
    const hasValidTransaction = isDefined(transactionInfo) && isPositiveNumber(transactionInfo.amount);
    const hasTranscription = isNotEmptyString(finalPrompt);
    const isConfirmPhase = status === 'idle' && hasTranscription && !userConfirmed;
    const showResult = userConfirmed && hasValidTransaction;

    const isOpenShared = useSharedValue(isOpen);
    const overlayOpacity = useSharedValue(isOpen ? OVERLAY_OPACITY : 0);

    const handleAnimationComplete = () => {
        setIsAnimatingOut(false);
    };

    useDerivedValue(() => {
        isOpenShared.value = isOpen;
    }, [isOpen]);

    useAnimatedReaction(
        () => isOpenShared.value,
        (current, previous) => {
            if (current && !previous) {
                overlayOpacity.value = OVERLAY_OPACITY;
            } else if (!current && previous) {
                runOnJS(setIsAnimatingOut)(true);
                overlayOpacity.value = withTiming(0, { duration: FADE_DURATION }, finished => {
                    if (finished) {
                        runOnJS(handleAnimationComplete)();
                    }
                });
            }
        },
        [isOpen]
    );

    const isVisible = isOpen || isAnimatingOut;

    const handleReset = () => {
        clearError();
        setFinalPrompt('');
        resetTransaction();
        setAccountId(null);
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

    const handleUserConfirm = () => {
        setUserConfirmed(true);
    };

    const handleTransactionConfirm = async () => {
        if (!isPositiveNumber(transactionInfo?.amount)) {
            return;
        }
        const selectedAccountId = accountId ?? defaultAccount?.id ?? null;
        await createExpense(transactionInfo.amount, transactionInfo.category?.id ?? 0, selectedAccountId, transactionInfo.comment);
        handleReset();
        onClose();
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

    const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

    if (!isVisible) {
        return null;
    }

    const downloadProgress = Math.min(llm.downloadProgress, stt.downloadProgress);
    const showTransactionCard = showResult;
    const showBubble = status === 'recording' || status === 'processing' || isConfirmPhase;
    const selectedAccountId = accountId ?? defaultAccount?.id ?? null;
    const buttonState = getButtonState();
    const micContainerStyle = { paddingBottom: bottom + MIC_BOTTOM_OFFSET };
    const closeContainerStyle = { paddingBottom: bottom };
    const hasError = isNotEmptyString(error);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Animated.View className="absolute inset-0 bg-black" style={overlayStyle} pointerEvents="none" />

            {showTransactionCard && (
                <Animated.View
                    className="absolute inset-x-4 top-1/4"
                    entering={FadeIn.duration(FADE_DURATION)}
                    exiting={FadeOut.duration(FADE_DURATION)}
                >
                    <AiTransactionPreviewCard
                        amount={transactionInfo.amount}
                        category={transactionInfo.category}
                        type={transactionInfo.type}
                        accountId={selectedAccountId}
                        onConfirm={handleTransactionConfirm}
                        onCancel={handleCancel}
                        onCategoryChange={setTransactionCategory}
                        onAccountChange={setAccountId}
                    />
                </Animated.View>
            )}

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
                <Pressable onPress={handleCancel}>
                    <View className="bg-primary rounded-full items-center justify-center w-18 h-18">
                        <Icon className="text-primary-reverse" icon={UserIconNameEnum.X} size={CLOSE_ICON_SIZE} />
                    </View>
                </Pressable>
            </View>
        </View>
    );
};
