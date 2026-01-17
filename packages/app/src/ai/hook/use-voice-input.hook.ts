import { useRef, useState } from 'react';

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

interface UseVoiceInputReturn {
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
    const [error, setError] = useState('');
    const [pendingText, setPendingText] = useState('');

    const stateRef = useRef<VoiceInputState>('idle');

    const updateState = (newState: VoiceInputState) => {
        stateRef.current = newState;
        setState(newState);
    };

    const categorization = useCategorization({
        onDone: (transaction: AITransactionInterface) => {
            if (stateRef.current === 'processing') {
                updateState('done');
                onDone?.(transaction);
            }
        },
        onError: (errorMessage: string) => {
            setError(errorMessage);
            updateState('error');
            onError?.(errorMessage);
        }
    });

    const transcribe = useStreamingTranscribe({
        onComplete: (text: string) => {
            if (!isNotEmptyString(text)) {
                updateState('idle');

                return;
            }

            setPendingText(text);
            updateState('confirming');
            categorization.categorize(text);
        },
        onError: (errorMessage: string) => {
            setError(errorMessage);
            updateState('error');
            onError?.(errorMessage);
        }
    });

    const isReady = transcribe.isReady && categorization.isReady;
    const downloadProgress = Math.min(transcribe.downloadProgress, categorization.downloadProgress);

    const start = () => {
        setError('');
        setPendingText('');
        categorization.reset();
        updateState('recording');
        transcribe.start();
    };

    const stop = () => {
        const currentText = transcribe.transcription.committed + transcribe.transcription.partial;

        if (isNotEmptyString(currentText)) {
            setPendingText(currentText);
            updateState('confirming');
            categorization.categorize(currentText);
            transcribe.cancel();
        } else {
            updateState('transcribing');
            transcribe.stop();
        }
    };

    const confirm = () => {
        if (stateRef.current !== 'confirming') {
            return;
        }

        if (isDefined(categorization.transaction)) {
            updateState('done');
            onDone?.(categorization.transaction);
        } else {
            updateState('processing');
        }
    };

    const cancel = () => {
        transcribe.cancel();
        categorization.reset();
        updateState('idle');
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
