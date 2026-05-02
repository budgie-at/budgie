import { AITransactionInterface } from '@budgie/ai';
import { getLogger } from '@budgie/logger';
import { useRef, useState } from 'react';

import { getErrorMessage, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { useLlmCategorization } from './use-llm-categorization.hook';
import { useRecording } from './use-recording.hook';
import { useStt } from './use-stt.hook';

const logger = getLogger('useVoiceInput');

type VoiceInputState = 'idle' | 'recording' | 'transcribing' | 'confirming' | 'processing' | 'done' | 'error';

interface VoiceInputData {
    readonly transcription: { readonly committed: string; readonly partial: string };
    readonly transactions: AITransactionInterface[];
    readonly error: string | null;
    readonly audioLevel: number;
}

interface VoiceInputCallbacks {
    readonly onDone?: (transactions: AITransactionInterface[]) => void;
    readonly onError?: (error: string) => void;
}

export interface UseVoiceInputReturn {
    readonly state: VoiceInputState;
    readonly data: VoiceInputData;
    readonly isReady: boolean;
    readonly downloadProgress: number;
    readonly start: () => void;
    readonly stop: () => void;
    readonly confirm: () => void;
    readonly cancel: () => void;
    readonly retry: () => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements
export const useVoiceInput = (callbacks: VoiceInputCallbacks = {}): UseVoiceInputReturn => {
    const { onDone, onError } = callbacks;

    const [state, setState] = useState<VoiceInputState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [finalTranscription, setFinalTranscription] = useState('');

    const isProcessingRef = useRef(false);
    const sessionIdRef = useRef(0);

    const stt = useStt();
    const categorization = useLlmCategorization();

    const handleError = (e: unknown) => {
        const errorMessage = getErrorMessage(e);
        logger.error('error', { errorMessage, sessionId: sessionIdRef.current });
        setError(errorMessage);
        setState('error');
        isProcessingRef.current = false;
        onError?.(errorMessage);
    };

    const isCurrentSession = (sessionId: number): boolean => sessionId === sessionIdRef.current;

    const markProcessingComplete = (): void => {
        isProcessingRef.current = false;
    };

    const stopSttStream = async (): Promise<string> => {
        try {
            logger.log('stt:stop:start', { sessionId: sessionIdRef.current });
            const text = await stt.stopStream();
            logger.log('stt:stop:done', { sessionId: sessionIdRef.current, textLen: text.length });

            return text;
        } catch (error: unknown) {
            logger.error('stt:stop:throw', { sessionId: sessionIdRef.current, errorMessage: getErrorMessage(error) });
            markProcessingComplete();
            throw error;
        }
    };

    const handleTranscriptionText = (text: string, sessionId: number): void => {
        if (!isCurrentSession(sessionId)) {
            return;
        }

        markProcessingComplete();

        if (!isNotEmptyString(text)) {
            logger.log('transcription:empty', { sessionId });
            setState('idle');

            return;
        }

        logger.log('transcription:ready', { sessionId, textLen: text.length });
        setFinalTranscription(text);
        setState('confirming');
    };

    const processTranscription = async (): Promise<void> => {
        if (isProcessingRef.current) {
            return;
        }

        const sessionId = sessionIdRef.current;
        isProcessingRef.current = true;
        logger.log('process:start', { sessionId });
        setState('transcribing');

        const text = await stopSttStream();
        handleTranscriptionText(text, sessionId);
    };

    const handleSilenceDetected = () => {
        logger.log('silence:detected', { sessionId: sessionIdRef.current });
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
        logger.log('start', {
            sessionId: sessionIdRef.current,
            sttReady: stt.isReady,
            categorizationReady: categorization.isReady
        });
        setError(null);
        setFinalTranscription('');
        isProcessingRef.current = false;
        categorization.reset();
        stt.startStream();
        logger.log('stt:stream:start', { sessionId: sessionIdRef.current });
        recording.start();
        setState('recording');
    };

    const stop = () => {
        logger.log('stop', {
            sessionId: sessionIdRef.current,
            isProcessing: isProcessingRef.current
        });
        recording.stop();

        if (isProcessingRef.current) {
            return;
        }
        processTranscription().catch(handleError);
    };

    const confirm = () => {
        logger.log('confirm', {
            sessionId: sessionIdRef.current,
            state,
            cachedTransactionCount: categorization.transactions.length,
            finalTranscriptionLen: finalTranscription.length
        });
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
        sessionIdRef.current += 1;
        logger.log('cancel', { sessionId: sessionIdRef.current });
        recording.cancel();
        stt.cancelStream();
        categorization.reset();
        setState('idle');
        setError(null);
        setFinalTranscription('');
        markProcessingComplete();
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
