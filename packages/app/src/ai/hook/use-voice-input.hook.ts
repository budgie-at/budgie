/* eslint-disable max-lines */
import { TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { AudioRecorder } from 'react-native-audio-api';
import { SpeechToTextLanguage } from 'react-native-executorch';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { useAllCategoriesQuery } from '../../category/query/use-all-categories.query';
import { useLocaleInfo } from '../../i18n/hook/use-locale-info.hook';
import {
    AUDIO_LEVEL_MULTIPLIER,
    BUFFER_LENGTH,
    RECORDER_INIT_DELAY_MS,
    SAMPLE_RATE,
    SILENCE_THRESHOLD,
    SILENCE_TIMEOUT_MS
} from '../constant/audio.constant';
import { useLlmContext } from '../context/llm.context';
import { AITransactionInterface } from '../interface/ai-transaction.interface';
import { calculateRMS } from '../util/calculate-rms.util';
import { filterTranscriptionTokens } from '../util/filter-transcription-tokens.util';
import { parseNumberFromMessage } from '../util/parse-number-words.util';
import { stripAmountsFromText } from '../util/strip-amounts-from-text.util';

import { useAudioManager } from './use-audio-manager.hook';

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

const extractCategoryIndex = (response: string): number | null => {
    const match = /\d+/u.exec(response);

    return isDefined(match) ? parseInt(match[0], 10) : null;
};

type CategoryItem = { id: number; title: string };

const findCategoryByTitle = (response: string, categories: CategoryItem[]): number | null => {
    const normalized = response.trim().toLowerCase();
    const words = normalized.split(/\s+/u);

    const exact = categories.find(cat => cat.title.toLowerCase() === normalized);
    if (isDefined(exact)) {
        return exact.id;
    }

    const contains = categories.find(cat => normalized.includes(cat.title.toLowerCase()) || cat.title.toLowerCase().includes(normalized));
    if (isDefined(contains)) {
        return contains.id;
    }

    for (const word of words) {
        const match = categories.find(cat => cat.title.toLowerCase().includes(word) || word.includes(cat.title.toLowerCase()));
        if (isDefined(match)) {
            return match.id;
        }
    }

    return null;
};

// eslint-disable-next-line max-lines-per-function, max-statements
export const useVoiceInput = (callbacks: VoiceInputCallbacks = {}): UseVoiceInputReturn => {
    const { onDone, onError } = callbacks;

    const { t } = useLingui();
    const locale = useLocaleInfo();
    const { llm, stt } = useLlmContext();
    const { categories } = useAllCategoriesQuery();

    useAudioManager();

    const [state, setState] = useState<VoiceInputState>('idle');
    const [transaction, setTransaction] = useState<AITransactionInterface | null>(null);
    const [error, setError] = useState('');
    const [audioLevel, setAudioLevel] = useState(0);

    const recorderRef = useRef<AudioRecorder | null>(null);
    const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const recorderInitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const streamPromiseRef = useRef<Promise<string> | null>(null);
    const sessionIdRef = useRef(0);
    const pendingTranscriptionRef = useRef('');
    const llmStartedRef = useRef(false);
    const isRecordingRef = useRef(false);

    const isReady = llm.isReady && stt.isReady;
    const downloadProgress = Math.min(llm.downloadProgress, stt.downloadProgress);

    const categoriesWithIds = categories.map((category, index) => `${index + 1}. ${category.title}`).join('\n');
    const categoriesCount = categories.length;
    const systemPrompt = t`Which category number matches this expense? Reply with ONLY the number.

${categoriesWithIds}

Reply with the number only (1-${categoriesCount}):`;

    const clearTimeouts = () => {
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
        if (recorderInitTimeoutRef.current) {
            clearTimeout(recorderInitTimeoutRef.current);
            recorderInitTimeoutRef.current = null;
        }
    };

    const cleanupRecorder = async () => {
        clearTimeouts();
        const wasRecording = isRecordingRef.current;
        isRecordingRef.current = false;

        try {
            recorderRef.current?.stop();
        } finally {
            recorderRef.current = null;
        }

        if (wasRecording && streamPromiseRef.current) {
            try {
                stt.streamStop();
                await streamPromiseRef.current;
            } finally {
                // eslint-disable-next-line require-atomic-updates
                streamPromiseRef.current = null;
            }
        } else {
            streamPromiseRef.current = null;
        }
    };

    const resetAll = () => {
        setState('idle');
        setTransaction(null);
        setError('');
        setAudioLevel(0);
        pendingTranscriptionRef.current = '';
        llmStartedRef.current = false;
        isRecordingRef.current = false;
    };

    const buildTransaction = (prompt: string, llmResponse: string): AITransactionInterface => {
        const indexFromResponse = extractCategoryIndex(llmResponse);
        const categoryByIndex = isDefined(indexFromResponse) ? categories[indexFromResponse - 1] : null;
        const categoryById = categories.find(cat => cat.id === findCategoryByTitle(llmResponse, categories));
        const category = categoryByIndex ?? categoryById ?? null;

        return {
            category,
            amount: parseNumberFromMessage(prompt),
            type: TransactionTypeEnum.EXPENSE,
            comment: prompt
        };
    };

    const startLlmGeneration = async (prompt: string) => {
        if (llmStartedRef.current) {
            return;
        }
        llmStartedRef.current = true;

        try {
            const textForCategorization = stripAmountsFromText(prompt);
            await llm.generate([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: textForCategorization }
            ]);

            const result = buildTransaction(prompt, llm.response);
            setTransaction(result);

            setState(current => {
                if (current === 'processing') {
                    onDone?.(result);

                    return 'done';
                }

                return current;
            });
        } catch (e: unknown) {
            if (!llm.isGenerating) {
                const errorMessage = e instanceof Error ? e.message : String(e);
                setError(errorMessage);
                setState('error');
                onError?.(errorMessage);
            }
        }
    };

    const handleTranscriptionComplete = (text: string) => {
        const finalText = text.trim();
        pendingTranscriptionRef.current = finalText;

        if (!isNotEmptyString(finalText)) {
            const errorMessage = t`No speech detected`;
            setError(errorMessage);
            setState('error');

            return;
        }

        setState('confirming');

        void startLlmGeneration(finalText);
    };

    // eslint-disable-next-line max-statements
    const finishRecording = async (sessionId: number) => {
        if (sessionId !== sessionIdRef.current) {
            return;
        }

        isRecordingRef.current = false;
        setState('transcribing');
        setAudioLevel(0);

        try {
            recorderRef.current?.stop();
        } finally {
            recorderRef.current = null;
        }

        if (streamPromiseRef.current) {
            try {
                stt.streamStop();
                const streamResult = await streamPromiseRef.current;
                const finalText = filterTranscriptionTokens(streamResult);
                handleTranscriptionComplete(finalText);
            } catch {
                const errorMessage = t`Transcription failed`;
                setError(errorMessage);
                setState('error');
                onError?.(errorMessage);
            } finally {
                // eslint-disable-next-line require-atomic-updates
                streamPromiseRef.current = null;
            }
        }

        clearTimeouts();
    };

    const resetSilenceTimeout = (sessionId: number) => {
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
        }
        silenceTimeoutRef.current = setTimeout(() => void finishRecording(sessionId), SILENCE_TIMEOUT_MS);
    };

    const handleAudioBuffer = (samples: Float32Array, sessionId: number) => {
        if (sessionId !== sessionIdRef.current || !isRecordingRef.current) {
            return;
        }

        const rms = calculateRMS(samples);
        setAudioLevel(Math.min(rms * AUDIO_LEVEL_MULTIPLIER, 1));

        stt.streamInsert(samples);

        if (rms > SILENCE_THRESHOLD) {
            resetSilenceTimeout(sessionId);
        }
    };

    const startInternal = (sessionId: number) => {
        streamPromiseRef.current = stt.stream({ language: locale.languageCode as SpeechToTextLanguage }).catch(() => '');

        recorderInitTimeoutRef.current = setTimeout(() => {
            if (sessionId !== sessionIdRef.current || !isRecordingRef.current) {
                return;
            }

            const recorder = new AudioRecorder({ sampleRate: SAMPLE_RATE, bufferLengthInSamples: BUFFER_LENGTH });
            recorderRef.current = recorder;
            recorder.onAudioReady(({ buffer }) => {
                if (sessionId !== sessionIdRef.current || !isRecordingRef.current) {
                    return;
                }
                handleAudioBuffer(buffer.getChannelData(0), sessionId);
            });
            recorder.start();
            resetSilenceTimeout(sessionId);
        }, RECORDER_INIT_DELAY_MS);
    };

    const start = () => {
        const doStart = async () => {
            await cleanupRecorder();
            resetAll();

            sessionIdRef.current += 1;
            const sessionId = sessionIdRef.current;

            setState('recording');
            isRecordingRef.current = true;

            startInternal(sessionId);
        };

        void doStart();
    };

    const stop = () => {
        void finishRecording(sessionIdRef.current);
    };

    const confirm = () => {
        if (state === 'confirming') {
            if (isDefined(transaction)) {
                setState('done');
                onDone?.(transaction);
            } else {
                setState('processing');
            }
        }
    };

    const cancel = () => {
        const doCancel = async () => {
            await cleanupRecorder();
            resetAll();
        };
        void doCancel();
    };

    const retry = () => {
        start();
    };

    const transcription = {
        committed: filterTranscriptionTokens(stt.committedTranscription),
        partial: filterTranscriptionTokens(stt.nonCommittedTranscription)
    };

    return {
        state,
        data: { transcription, transaction, error, audioLevel },
        isReady,
        downloadProgress,
        start,
        stop,
        confirm,
        cancel,
        retry
    };
};
