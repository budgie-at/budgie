import { AITransactionInterface } from '@budgie/ai';
import { useRef, useState } from 'react';

import { getErrorMessage, isDefined, isNotEmptyString } from '@rnw-community/shared';

import { VoiceInputCollectionInterface } from '../interface/voice-input-collection.interface';

import { useLlmCategorization } from './use-llm-categorization.hook';
import { useRecording } from './use-recording.hook';
import { useStt } from './use-stt.hook';

type VoiceInputState = 'idle' | 'recording' | 'transcribing' | 'processing' | 'done' | 'error';

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
    readonly startAndCollect: () => Promise<VoiceInputCollectionInterface>;
    readonly stop: () => void;
    readonly cancel: () => void;
}

class CancelledError extends Error {
    constructor() {
        // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal flow control, not user-facing
        super('Voice input cancelled');
        // eslint-disable-next-line lingui/no-unlocalized-strings -- Error class name, not user-facing
        this.name = 'CancelledError';
    }
}

// eslint-disable-next-line max-lines-per-function, max-statements -- Hook orchestrates the full record-transcribe-categorize lifecycle as a single awaitable
export const useVoiceInput = (): UseVoiceInputReturn => {
    const [state, setState] = useState<VoiceInputState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [finalTranscription, setFinalTranscription] = useState('');

    const resolverRef = useRef<((value: VoiceInputCollectionInterface) => void) | null>(null);
    const rejecterRef = useRef<((reason: unknown) => void) | null>(null);

    const stt = useStt();
    const categorization = useLlmCategorization();

    const settle = (transactions: AITransactionInterface[], originalText: string) => {
        const resolver = resolverRef.current;
        resolverRef.current = null;
        rejecterRef.current = null;
        resolver?.({ transactions, originalText });
    };

    const reject = (reason: unknown) => {
        const rejecter = rejecterRef.current;
        resolverRef.current = null;
        rejecterRef.current = null;
        rejecter?.(reason);
    };

    const handleError = (e: unknown) => {
        setError(getErrorMessage(e));
        setState('error');
        reject(e);
    };

    const runPipeline = async (): Promise<void> => {
        setState('transcribing');
        const text = await stt.stopStream();

        if (!isNotEmptyString(text)) {
            setState('idle');
            settle([], '');

            return;
        }

        setFinalTranscription(text);
        setState('processing');

        const transactions = await categorization.categorize(text);

        setState('done');
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

    const startAndCollect = (): Promise<VoiceInputCollectionInterface> => {
        if (isDefined(rejecterRef.current)) {
            rejecterRef.current(new CancelledError());
        }

        setError(null);
        setFinalTranscription('');
        categorization.reset();
        stt.startStream();
        recording.start();
        setState('recording');

        return new Promise<VoiceInputCollectionInterface>((resolve, reject) => {
            resolverRef.current = resolve;
            rejecterRef.current = reject;
        });
    };

    const stop = () => {
        if (state !== 'recording') {
            return;
        }
        recording.stop();
        runPipeline().catch(handleError);
    };

    const cancel = () => {
        recording.cancel();
        stt.cancelStream();
        categorization.reset();
        setState('idle');
        setError(null);
        setFinalTranscription('');
        reject(new CancelledError());
    };

    const transcription =
        state === 'processing' || state === 'done'
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
