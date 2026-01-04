import { useEffect, useRef, useState } from 'react';
import { AudioRecorder } from 'react-native-audio-api';
import { SpeechToTextLanguage } from 'react-native-executorch';

import { useLocaleInfo } from '../../i18n/hook/use-locale-info.hook';
import {
    AUDIO_LEVEL_MULTIPLIER,
    BUFFER_LENGTH,
    RECORDER_INIT_DELAY_MS,
    SAMPLE_RATE,
    SILENCE_THRESHOLD,
    SILENCE_TIMEOUT_MS,
    VOICE_DETECTION_THRESHOLD
} from '../constant/audio.constant';
import { useLlmContext } from '../context/llm.context';
import { calculateRMS } from '../util/calculate-rms.util';
import { filterTranscriptionTokens } from '../util/filter-transcription-tokens.util';
import { useSessionGuard } from '../util/use-session-guard.util';

import { useAudioManager } from './use-audio-manager.hook';

type TranscribeStatus = 'idle' | 'recording' | 'processing';

interface TranscriptionState {
    committed: string;
    partial: string;
}

interface UseStreamingTranscribeReturn {
    startRecording: () => void;
    stopRecording: () => void;
    status: TranscribeStatus;
    transcription: TranscriptionState;
    audioLevel: number;
    isVoiceDetected: boolean;
}

// eslint-disable-next-line max-lines-per-function
export const useStreamingTranscribe = (onComplete: (transcribed: string) => Promise<void>): UseStreamingTranscribeReturn => {
    const locale = useLocaleInfo();
    const { stt } = useLlmContext();
    const session = useSessionGuard();

    const [status, setStatus] = useState<TranscribeStatus>('idle');
    const [audioLevel, setAudioLevel] = useState(0);
    const [isVoiceDetected, setIsVoiceDetected] = useState(false);

    const recorderRef = useRef<AudioRecorder | null>(null);
    const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const recorderInitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isRecordingRef = useRef(false);
    const streamPromiseRef = useRef<Promise<string> | null>(null);

    useAudioManager();

    const clearSilenceTimeout = () => {
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
    };

    const clearRecorderInitTimeout = () => {
        if (recorderInitTimeoutRef.current) {
            clearTimeout(recorderInitTimeoutRef.current);
            recorderInitTimeoutRef.current = null;
        }
    };

    const cleanupRecorder = async () => {
        clearSilenceTimeout();
        clearRecorderInitTimeout();

        try {
            recorderRef.current?.stop();
        } finally {
            recorderRef.current = null;
        }

        if (isRecordingRef.current && streamPromiseRef.current) {
            stt.streamStop();
            try {
                await streamPromiseRef.current;
            } finally {
                // eslint-disable-next-line require-atomic-updates
                streamPromiseRef.current = null;
            }
        }

        // eslint-disable-next-line require-atomic-updates
        isRecordingRef.current = false;
    };

    // eslint-disable-next-line max-statements
    const finishRecording = async (sessionId: number) => {
        if (!session.isCurrentSession(sessionId)) {
            return;
        }

        setStatus('processing');
        setAudioLevel(0);
        setIsVoiceDetected(false);

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

                void onComplete(finalText.trim()).finally(() => {
                    if (session.isCurrentSession(sessionId)) {
                        setStatus('idle');
                    }
                });
            } catch {
                setStatus('idle');
            }

            // eslint-disable-next-line require-atomic-updates
            streamPromiseRef.current = null;
        }

        isRecordingRef.current = false;
        clearSilenceTimeout();
    };

    const resetSilenceTimeout = (sessionId: number) => {
        clearSilenceTimeout();
        silenceTimeoutRef.current = setTimeout(() => void finishRecording(sessionId), SILENCE_TIMEOUT_MS);
    };

    const stopRecording = () => void finishRecording(session.getCurrentSessionId());

    const resetRecordingState = () => {
        setStatus('recording');
        setAudioLevel(0);
        setIsVoiceDetected(false);
        isRecordingRef.current = true;
    };

    const handleAudioBuffer = (samples: Float32Array, sessionId: number) => {
        const rms = calculateRMS(samples);

        setAudioLevel(Math.min(rms * AUDIO_LEVEL_MULTIPLIER, 1));
        setIsVoiceDetected(rms > VOICE_DETECTION_THRESHOLD);

        stt.streamInsert(samples);

        if (rms > SILENCE_THRESHOLD) {
            resetSilenceTimeout(sessionId);
        }
    };

    const startRecording = () => {
        void cleanupRecorder();
        const sessionId = session.startNewSession();

        resetRecordingState();

        streamPromiseRef.current = stt.stream({ language: locale.languageCode as SpeechToTextLanguage }).catch(() => '');

        recorderInitTimeoutRef.current = setTimeout(() => {
            if (!session.isCurrentSession(sessionId)) {
                return;
            }

            const recorder = new AudioRecorder({ sampleRate: SAMPLE_RATE, bufferLengthInSamples: BUFFER_LENGTH });
            recorderRef.current = recorder;
            recorder.onAudioReady(({ buffer }) => {
                if (!session.isCurrentSession(sessionId) || !isRecordingRef.current) {
                    return;
                }
                handleAudioBuffer(buffer.getChannelData(0), sessionId);
            });
            recorder.start();
            resetSilenceTimeout(sessionId);
        }, RECORDER_INIT_DELAY_MS);
    };

    useEffect(
        () => () => void cleanupRecorder(),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const transcription: TranscriptionState = {
        committed: filterTranscriptionTokens(stt.committedTranscription),
        partial: filterTranscriptionTokens(stt.nonCommittedTranscription)
    };

    return { startRecording, stopRecording, status, transcription, audioLevel, isVoiceDetected };
};
