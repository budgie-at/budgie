import { useRef, useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { AITransactionInterface } from '../interface/ai-transaction.interface';

import { useLlmCategorization } from './use-llm-categorization.hook';
import { useRecording } from './use-recording.hook';
import { useStt } from './use-stt.hook';

type VoiceInputState = 'idle' | 'recording' | 'transcribing' | 'confirming' | 'processing' | 'done' | 'error';

interface VoiceInputData {
    transcription: { committed: string; partial: string };
    transaction: AITransactionInterface | null;
    error: string | null;
    audioLevel: number;
}

interface VoiceInputCallbacks {
    onDone?: (transaction: AITransactionInterface) => void;
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
        const errorMessage = e instanceof Error ? e.message : String(e);
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
        void (async () => {
            try {
                await processTranscription();
            } catch (e: unknown) {
                handleError(e);
            }
        })();
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
            void (async () => {
                try {
                    await processTranscription();
                } catch (e: unknown) {
                    handleError(e);
                }
            })();
        }
    };

    const confirm = () => {
        if (state !== 'confirming') {
            return;
        }

        if (isDefined(categorization.transaction)) {
            setState('done');
            onDone?.(categorization.transaction);
        } else {
            setState('processing');

            void (async () => {
                try {
                    const result = await categorization.categorize(finalTranscription);
                    setState('done');
                    onDone?.(result);
                } catch (e: unknown) {
                    handleError(e);
                }
            })();
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
            transaction: categorization.transaction,
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
