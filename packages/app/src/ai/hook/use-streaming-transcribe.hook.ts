import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioRecorder } from 'react-native-audio-api';
import { SpeechToTextLanguage } from 'react-native-executorch';

import { useLocaleInfo } from '../../i18n/hook/use-locale-info.hook';
import {
    AUDIO_LEVEL_MULTIPLIER,
    BUFFER_LENGTH,
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

const needsSpace = (existing: string, incoming: string): boolean =>
    existing.length > 0 && incoming.length > 0 && !existing.endsWith(' ') && !incoming.startsWith(' ');

// eslint-disable-next-line max-lines-per-function,max-statements
export const useStreamingTranscribe = (onComplete: (transcribed: string) => Promise<void>): UseStreamingTranscribeReturn => {
    const locale = useLocaleInfo();
    const { stt } = useLlmContext();
    const session = useSessionGuard();

    const [status, setStatus] = useState<TranscribeStatus>('idle');
    const [audioLevel, setAudioLevel] = useState(0);
    const [isVoiceDetected, setIsVoiceDetected] = useState(false);

    const recorderRef = useRef<AudioRecorder | null>(null);
    const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isRecordingRef = useRef(false);

    useAudioManager();

    const clearSilenceTimeout = useCallback(() => {
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
    }, []);

    const cleanupRecorder = useCallback(() => {
        clearSilenceTimeout();

        if (recorderRef.current) {
            try {
                recorderRef.current.stop();
            } catch {
                // Ignore stop errors
            }
            recorderRef.current = null;
        }

        try {
            stt.streamStop();
        } catch {
            // Ignore stream stop errors
        }

        isRecordingRef.current = false;
    }, [clearSilenceTimeout, stt]);

    const runStreamTranscription = useCallback(async () => {
        try {
            await stt.stream({ language: locale.languageCode as SpeechToTextLanguage });
        } catch {
            // Stream ended or error - this is expected when stopping
        }
    }, [locale.languageCode, stt]);

    const finishRecording = useCallback(
        (sessionId: number) => {
            if (!session.isCurrentSession(sessionId)) {
                return;
            }

            cleanupRecorder();
            setStatus('processing');
            setAudioLevel(0);
            setIsVoiceDetected(false);

            const finalCommitted = filterTranscriptionTokens(stt.committedTranscription);
            const finalPartial = filterTranscriptionTokens(stt.nonCommittedTranscription);
            const finalText = filterTranscriptionTokens(
                finalCommitted + (needsSpace(finalCommitted, finalPartial) ? ' ' : '') + finalPartial
            );

            void onComplete(finalText.trim()).finally(() => {
                if (session.isCurrentSession(sessionId)) {
                    setStatus('idle');
                }
            });
        },
        [cleanupRecorder, onComplete, session, stt.committedTranscription, stt.nonCommittedTranscription]
    );

    const resetSilenceTimeout = useCallback(
        (sessionId: number) => {
            clearSilenceTimeout();
            silenceTimeoutRef.current = setTimeout(() => void finishRecording(sessionId), SILENCE_TIMEOUT_MS);
        },
        [clearSilenceTimeout, finishRecording]
    );

    const stopRecording = useCallback(() => void finishRecording(session.getCurrentSessionId()), [finishRecording, session]);

    const resetRecordingState = useCallback(() => {
        setStatus('recording');
        setAudioLevel(0);
        setIsVoiceDetected(false);
        isRecordingRef.current = true;
    }, []);

    const handleAudioBuffer = useCallback(
        (samples: Float32Array, sessionId: number) => {
            const rms = calculateRMS(samples);

            setAudioLevel(Math.min(rms * AUDIO_LEVEL_MULTIPLIER, 1));
            setIsVoiceDetected(rms > VOICE_DETECTION_THRESHOLD);

            try {
                stt.streamInsert(samples);
            } catch {
                // Ignore insert errors
            }

            if (rms > SILENCE_THRESHOLD) {
                resetSilenceTimeout(sessionId);
            }
        },
        [resetSilenceTimeout, stt]
    );

    const startRecording = useCallback(() => {
        cleanupRecorder();
        const sessionId = session.startNewSession();

        resetRecordingState();

        void runStreamTranscription();

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
    }, [cleanupRecorder, handleAudioBuffer, resetRecordingState, resetSilenceTimeout, runStreamTranscription, session]);

    useEffect(() => cleanupRecorder, [cleanupRecorder]);

    const transcription: TranscriptionState = {
        committed: filterTranscriptionTokens(stt.committedTranscription),
        partial: filterTranscriptionTokens(stt.nonCommittedTranscription)
    };

    return { startRecording, stopRecording, status, transcription, audioLevel, isVoiceDetected };
};
