import { AITransactionInterface } from '@budgie/ai';
import { useRef, useState } from 'react';

import { getErrorMessage, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { useLlmCategorization } from './use-llm-categorization.hook';
import { useRecording } from './use-recording.hook';
import { useStt } from './use-stt.hook';

type VoiceInputState = 'idle' | 'recording' | 'transcribing' | 'confirming' | 'processing' | 'done' | 'error';

interface VoiceInputData {
    transcription: { committed: string; partial: string };
    transactions: AITransactionInterface[];
    error: string | null;
    audioLevel: number;
}

interface VoiceInputCallbacks {
    onDone?: (transactions: AITransactionInterface[]) => void;
    onError?: (error: string) => void;
}

export interface UseVoiceInputReturn {
    state: VoiceInputState;
    data: VoiceInputData;
    isReady: boolean;
    downloadProgress: number;
    start: () => void;
    stop: () => void;
    confirm: () => void;
    cancel: () => void;
    retry: () => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements
export const useVoiceInput = (callbacks: VoiceInputCallbacks = {}): UseVoiceInputReturn => {
    const { onDone, onError } = callbacks;

    const [state, setState] = useState<VoiceInputState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [finalTranscription, setFinalTranscription] = useState('');

    const isProcessingRef = useRef(false);

    const stt = useStt();
    const categorization = useLlmCategorization();

    const handleError = (e: unknown) => {
        const errorMessage = getErrorMessage(e);
        setError(errorMessage);
        setState('error');
        isProcessingRef.current = false;
        onError?.(errorMessage);
    };

    const processTranscription = async (): Promise<void> => {
        if (isProcessingRef.current) {
            return;
        }

        isProcessingRef.current = true;
        setState('transcribing');

        const text = await stt.stopStream();

        // eslint-disable-next-line require-atomic-updates
        isProcessingRef.current = false;

        if (!isNotEmptyString(text)) {
            setState('idle');

            return;
        }

        setFinalTranscription(text);
        setState('confirming');
    };

    const handleSilenceDetected = () => {
        processTranscription().catch(handleError);
    };

    const recording = useRecording({
        onAudioBuffer: (samples: Float32Array) => {
            stt.insertAudio(samples);
        },
        onSilenceDetected: handleSilenceDetected
    });

    const isReady = stt.isReady && categorization.isReady;
    const downloadProgress = Math.min(stt.downloadProgress, categorization.downloadProgress);

    const start = () => {
        setError(null);
        setFinalTranscription('');
        isProcessingRef.current = false;
        categorization.reset();
        stt.startStream();
        recording.start();
        setState('recording');
    };

    const stop = () => {
        recording.stop();

        if (isProcessingRef.current) {
            return;
        }

        const currentText = stt.transcription + stt.partialTranscription;

        if (isNotEmptyString(currentText)) {
            setFinalTranscription(currentText);
            setState('confirming');
            stt.cancelStream();
        } else {
            processTranscription().catch(handleError);
        }
    };

    const confirm = () => {
        if (state !== 'confirming') {
            return;
        }

        if (isNotEmptyArray(categorization.transactions)) {
            setState('done');
            onDone?.(categorization.transactions);
        } else {
            setState('processing');

            void categorization.categorize(finalTranscription).then((results: AITransactionInterface[]) => {
                setState('done');
                onDone?.(results);

                return results;
            }, handleError);
        }
    };

    const cancel = () => {
        recording.cancel();
        stt.cancelStream();
        categorization.reset();
        setState('idle');
        setError(null);
        setFinalTranscription('');
        isProcessingRef.current = false;
    };

    const transcription =
        state === 'confirming' || state === 'processing' || state === 'done'
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
        start,
        stop,
        confirm,
        cancel,
        retry: start
    };
};
