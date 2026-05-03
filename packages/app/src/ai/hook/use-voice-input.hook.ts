import { AITransactionInterface } from '@budgie/ai';
import { useRef, useState } from 'react';

import { getErrorMessage, isNotEmptyString } from '@rnw-community/shared';

import { VoiceInputStateEnum } from '../enum/voice-input-state.enum';
import { UseVoiceInputReturnInterface } from '../interface/use-voice-input-return.interface';

import { useLlmCategorization } from './use-llm-categorization.hook';
import { useRecording } from './use-recording.hook';
import { useStt } from './use-stt.hook';

type VoiceInputResultCallback = (transactions: AITransactionInterface[], originalText: string) => void;

// eslint-disable-next-line max-statements -- Hook orchestrates the full record-transcribe-categorize lifecycle as a single awaitable
export const useVoiceInput = (): UseVoiceInputReturnInterface => {
    const [state, setState] = useState<VoiceInputStateEnum>(VoiceInputStateEnum.IDLE);
    const [error, setError] = useState<string | null>(null);
    const [finalTranscription, setFinalTranscription] = useState('');

    const resultRef = useRef<VoiceInputResultCallback | null>(null);

    const stt = useStt();
    const categorization = useLlmCategorization();

    const settle = (transactions: AITransactionInterface[], originalText: string) => {
        const callback = resultRef.current;
        resultRef.current = null;
        callback?.(transactions, originalText);
    };

    const handleError = (e: unknown) => {
        setError(getErrorMessage(e));
        setState(VoiceInputStateEnum.ERROR);
        settle([], '');
    };

    const runPipeline = async (): Promise<void> => {
        setState(VoiceInputStateEnum.TRANSCRIBING);
        const text = await stt.stopStream();

        if (!isNotEmptyString(text)) {
            setState(VoiceInputStateEnum.IDLE);
            settle([], '');

            return;
        }

        setFinalTranscription(text);
        setState(VoiceInputStateEnum.PROCESSING);

        const transactions = await categorization.categorize(text);

        setState(VoiceInputStateEnum.DONE);
        settle(transactions, text);
    };

    const handleSilenceDetected = () => {
        runPipeline().catch(handleError);
    };

    const recording = useRecording({
        onAudioBuffer: stt.insertAudio,
        onSilenceDetected: handleSilenceDetected
    });

    const isReady = stt.isReady && categorization.isReady;
    const downloadProgress = Math.min(stt.downloadProgress, categorization.downloadProgress);

    const startAndCollect = (onResult: VoiceInputResultCallback): void => {
        setError(null);
        setFinalTranscription('');
        categorization.reset();
        stt.startStream();
        recording.start();
        setState(VoiceInputStateEnum.RECORDING);
        resultRef.current = onResult;
    };

    const stop = () => {
        if (state !== VoiceInputStateEnum.RECORDING) {
            return;
        }
        recording.stop();
        runPipeline().catch(handleError);
    };

    const cancel = () => {
        recording.cancel();
        stt.cancelStream();
        categorization.reset();
        resultRef.current = null;
        setState(VoiceInputStateEnum.IDLE);
        setError(null);
        setFinalTranscription('');
    };

    const isPipelineFinishing = state === VoiceInputStateEnum.PROCESSING || state === VoiceInputStateEnum.DONE;
    const transcription = isPipelineFinishing
        ? { committed: finalTranscription, partial: '' }
        : { committed: stt.transcription, partial: stt.partialTranscription };

    return {
        state,
        data: {
            transcription,
            transactions: categorization.transactions,
            error,
            audioLevel: recording.audioLevel
        },
        isReady,
        downloadProgress,
        startAndCollect,
        stop,
        cancel
    };
};
