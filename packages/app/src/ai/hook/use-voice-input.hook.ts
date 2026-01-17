import { useLingui } from '@lingui/react/macro';
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

export const useVoiceInput = (callbacks: VoiceInputCallbacks = {}): UseVoiceInputReturn => {
    const { onDone, onError } = callbacks;

    const { t } = useLingui();

    const [state, setState] = useState<VoiceInputState>('idle');
    const [error, setError] = useState('');
    const [pendingText, setPendingText] = useState('');

    const handleTranscribeComplete = (text: string) => {
        if (!isNotEmptyString(text)) {
            const errorMessage = t`No speech detected`;
            setError(errorMessage);
            setState('error');
            onError?.(errorMessage);

            return;
        }

        setPendingText(text);
        setState('confirming');
        categorization.categorize(text);
    };

    const handleTranscribeError = (errorMessage: string) => {
        setError(errorMessage);
        setState('error');
        onError?.(errorMessage);
    };

    const handleCategorizationDone = (transaction: AITransactionInterface) => {
        setState(current => {
            if (current === 'processing') {
                onDone?.(transaction);

                return 'done';
            }

            return current;
        });
    };

    const handleCategorizationError = (errorMessage: string) => {
        setError(errorMessage);
        setState('error');
        onError?.(errorMessage);
    };

    const transcribe = useStreamingTranscribe({
        onComplete: handleTranscribeComplete,
        onError: handleTranscribeError
    });

    const categorization = useCategorization({
        onDone: handleCategorizationDone,
        onError: handleCategorizationError
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
        setState('transcribing');
        transcribe.stop();
    };

    const confirm = () => {
        if (state === 'confirming') {
            if (isDefined(categorization.transaction)) {
                setState('done');
                onDone?.(categorization.transaction);
            } else {
                setState('processing');
            }
        }
    };

    const cancel = () => {
        transcribe.cancel();
        categorization.reset();
        setState('idle');
        setError('');
        setPendingText('');
    };

    const retry = () => {
        start();
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
        retry
    };
};
