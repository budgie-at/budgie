import { useState } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { AITransactionInterface } from '../interface/ai-transaction.interface';

import { useCategorization } from './use-categorization.hook';
import { useStreamingTranscribe } from './use-streaming-transcribe.hook';

type VoiceInputState = 'idle' | 'recording' | 'transcribing' | 'confirming' | 'processing' | 'done' | 'error';

interface VoiceInputData {
    transcription: { committed: string; partial: string };
    transaction: AITransactionInterface | null;
    error: string;
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

// eslint-disable-next-line max-lines-per-function
export const useVoiceInput = (callbacks: VoiceInputCallbacks = {}): UseVoiceInputReturn => {
    const { onDone, onError } = callbacks;

    const [state, setState] = useState<VoiceInputState>('idle');
    const [error, setError] = useState('');
    const [pendingText, setPendingText] = useState('');

    const categorization = useCategorization({
        onDone: (transaction: AITransactionInterface) => {
            if (state === 'processing') {
                setState('done');
                onDone?.(transaction);
            }
        },
        onError: (errorMessage: string) => {
            setError(errorMessage);
            setState('error');
            onError?.(errorMessage);
        }
    });

    const transcribe = useStreamingTranscribe({
        onComplete: (text: string) => {
            if (!isNotEmptyString(text)) {
                setState('idle');

                return;
            }

            setPendingText(text);
            setState('confirming');
            categorization.categorize(text);
        },
        onError: (errorMessage: string) => {
            setError(errorMessage);
            setState('error');
            onError?.(errorMessage);
        }
    });

    const isReady = transcribe.isReady && categorization.isReady;
    const downloadProgress = Math.min(transcribe.downloadProgress, categorization.downloadProgress);

    const start = () => {
        setError('');
        setPendingText('');
        categorization.reset();
        setState('recording');
        transcribe.start();
    };

    const stop = () => {
        const currentText = transcribe.transcription.committed + transcribe.transcription.partial;

        if (isNotEmptyString(currentText)) {
            setPendingText(currentText);
            setState('confirming');
            categorization.categorize(currentText);
            transcribe.cancel();
        } else {
            setState('transcribing');
            transcribe.stop();
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
        }
    };

    const cancel = () => {
        transcribe.cancel();
        categorization.reset();
        setState('idle');
        setError('');
        setPendingText('');
    };

    const transcription =
        state === 'confirming' || state === 'processing' || state === 'done'
            ? { committed: pendingText, partial: '' }
            : transcribe.transcription;

    return {
        state,
        data: {
            transcription,
            transaction: categorization.transaction,
            error,
            audioLevel: transcribe.audioLevel
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
