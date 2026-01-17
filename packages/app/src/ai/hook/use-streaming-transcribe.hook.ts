import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { AudioRecorder } from 'react-native-audio-api';
import { SpeechToTextLanguage } from 'react-native-executorch';

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
import { calculateRMS } from '../util/calculate-rms.util';
import { filterTranscriptionTokens } from '../util/filter-transcription-tokens.util';

import { useAudioManager } from './use-audio-manager.hook';

type TranscribeStatus = 'idle' | 'recording' | 'processing';

interface TranscribeCallbacks {
    onComplete?: (text: string) => void;
    onError?: (error: string) => void;
}

interface UseStreamingTranscribeReturn {
    status: TranscribeStatus;
    transcription: { committed: string; partial: string };
    audioLevel: number;
    isReady: boolean;
    downloadProgress: number;
    start: () => void;
    stop: () => void;
    cancel: () => void;
}

// eslint-disable-next-line max-lines-per-function, max-statements
export const useStreamingTranscribe = (callbacks: TranscribeCallbacks = {}): UseStreamingTranscribeReturn => {
    const { onComplete, onError } = callbacks;

    const { t } = useLingui();
    const locale = useLocaleInfo();
    const { stt } = useLlmContext();

    useAudioManager();

    const [status, setStatus] = useState<TranscribeStatus>('idle');
    const [audioLevel, setAudioLevel] = useState(0);

    const recorderRef = useRef<AudioRecorder | null>(null);
    const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const recorderInitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const streamPromiseRef = useRef<Promise<string> | null>(null);
    const sessionIdRef = useRef(0);
    const isRecordingRef = useRef(false);

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
        setStatus('idle');
        setAudioLevel(0);
        isRecordingRef.current = false;
    };

    // eslint-disable-next-line max-statements
    const finishRecording = async (sessionId: number) => {
        if (sessionId !== sessionIdRef.current) {
            return;
        }

        isRecordingRef.current = false;
        setStatus('processing');
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
                const finalText = filterTranscriptionTokens(streamResult).trim();
                setStatus('idle');
                onComplete?.(finalText);
            } catch {
                setStatus('idle');
                onError?.(t`Transcription failed`);
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

            setStatus('recording');
            isRecordingRef.current = true;

            startInternal(sessionId);
        };

        void doStart();
    };

    const stop = () => {
        void finishRecording(sessionIdRef.current);
    };

    const cancel = () => {
        const doCancel = async () => {
            await cleanupRecorder();
            resetAll();
        };
        void doCancel();
    };

    const transcription = {
        committed: filterTranscriptionTokens(stt.committedTranscription),
        partial: filterTranscriptionTokens(stt.nonCommittedTranscription)
    };

    return {
        status,
        transcription,
        audioLevel,
        isReady: stt.isReady,
        downloadProgress: stt.downloadProgress,
        start,
        stop,
        cancel
    };
};
