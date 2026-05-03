import { AITransactionInterface } from '@budgie/ai';
import { useRef, useState } from 'react';

import { getErrorMessage, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { useLlmCategorization } from './use-llm-categorization.hook';
import { useRecording } from './use-recording.hook';
import { useStt } from './use-stt.hook';

type VoiceInputState = 'idle' | 'recording' | 'transcribing' | 'confirming' | 'processing' | 'done' | 'error';

interface VoiceInputData {
    readonly transcription: { readonly committed: string; readonly partial: string };
    readonly transactions: AITransactionInterface[];
    readonly error: string | null;
    readonly audioLevel: number;
}

export interface UseVoiceInputReturn {
    readonly state: VoiceInputState;
    readonly data: VoiceInputData;
    readonly isReady: boolean;
    readonly downloadProgress: number;
    readonly start: () => void;
    readonly stop: () => void;
    readonly confirmAndCategorize: () => Promise<AITransactionInterface[]>;
    readonly cancel: () => void;
    readonly retry: () => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements -- Hook orchestrates recording, STT, categorization, and confirmation lifecycle
export const useVoiceInput = (): UseVoiceInputReturn => {
    const [state, setState] = useState<VoiceInputState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [finalTranscription, setFinalTranscription] = useState('');

    const isProcessingRef = useRef(false);
    const sessionIdRef = useRef(0);

    const stt = useStt();
    const categorization = useLlmCategorization();

    const handleError = (e: unknown) => {
        const errorMessage = getErrorMessage(e);

        setError(errorMessage);
        setState('error');
        isProcessingRef.current = false;
    };

    const isCurrentSession = (sessionId: number): boolean => sessionId === sessionIdRef.current;

    const handleTranscriptionText = (text: string, sessionId: number): void => {
        if (!isCurrentSession(sessionId)) {
            return;
        }

        isProcessingRef.current = false;

        if (!isNotEmptyString(text)) {
            setState('idle');

            return;
        }

        setFinalTranscription(text);
        setState('confirming');
    };

    const processTranscription = async (): Promise<void> => {
        if (isProcessingRef.current) {
            return;
        }

        const sessionId = sessionIdRef.current;
        isProcessingRef.current = true;
        setState('transcribing');

        const text = await stt.stopStream().catch((error: unknown) => {
            isProcessingRef.current = false;
            throw error;
        });

        handleTranscriptionText(text, sessionId);
    };

    const handleSilenceDetected = () => {
        processTranscription().catch(handleError);
    };

    const recording = useRecording({
        onAudioBuffer: stt.insertAudio,
        onSilenceDetected: handleSilenceDetected
    });

    const isReady = stt.isReady && categorization.isReady;
    const downloadProgress = Math.min(stt.downloadProgress, categorization.downloadProgress);

    const start = () => {
        sessionIdRef.current += 1;
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
        processTranscription().catch(handleError);
    };

    const confirmAndCategorize = async (): Promise<AITransactionInterface[]> => {
        if (state !== 'confirming') {
            return [];
        }

        if (isNotEmptyArray(categorization.transactions)) {
            setState('done');

            return categorization.transactions;
        }

        setState('processing');

        try {
            const results = await categorization.categorize(finalTranscription);

            setState('done');

            return results;
        } catch (categorizeError: unknown) {
            handleError(categorizeError);
            throw categorizeError;
        }
    };

    const cancel = () => {
        sessionIdRef.current += 1;
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
        confirmAndCategorize,
        cancel,
        retry: start
    };
};
