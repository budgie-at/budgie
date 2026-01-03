import { useEffect, useRef, useState } from 'react';
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
    const streamPromiseRef = useRef<Promise<string> | null>(null);

    useAudioManager();

    const clearSilenceTimeout = () => {
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
    };

    const cleanupRecorder = async () => {
        clearSilenceTimeout();

        if (recorderRef.current) {
            try {
                recorderRef.current.stop();
            } catch {
                // Ignore stop errors
            }
            recorderRef.current = null;
        }

        if (isRecordingRef.current && streamPromiseRef.current) {
            try {
                stt.streamStop();
                await streamPromiseRef.current;
            } catch {
                // Ignore stream stop errors
            }
            streamPromiseRef.current = null;
        }

        isRecordingRef.current = false;
    };

    const runStreamTranscription = () => {
        // eslint-disable-next-line no-console,lingui/no-unlocalized-strings
        console.log('[STT] Starting stream with language:', locale.languageCode);

        streamPromiseRef.current = stt.stream({ language: locale.languageCode as SpeechToTextLanguage })
            .then((result: string) => {
                // eslint-disable-next-line no-console,lingui/no-unlocalized-strings
                console.log('[STT] Stream completed with result:', result);

                return result;
            })
            .catch((error: unknown) => {
                // eslint-disable-next-line no-console,lingui/no-unlocalized-strings
                console.log('[STT] Stream error:', error);

                return '';
            });
    };

    const finishRecording = async (sessionId: number) => {
        if (!session.isCurrentSession(sessionId)) {
            return;
        }

        setStatus('processing');
        setAudioLevel(0);
        setIsVoiceDetected(false);

        const streamResult = streamPromiseRef.current ? await streamPromiseRef.current : '';

        await cleanupRecorder();

        // eslint-disable-next-line no-console,lingui/no-unlocalized-strings
        console.log('[STT] Stream result:', streamResult);

        const finalText = filterTranscriptionTokens(streamResult);

        // eslint-disable-next-line no-console,lingui/no-unlocalized-strings
        console.log('[STT] Final text after filtering:', finalText);

        void onComplete(finalText.trim()).finally(() => {
            if (session.isCurrentSession(sessionId)) {
                setStatus('idle');
            }
        });
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

        try {
            stt.streamInsert(samples);
        } catch (error) {
            // eslint-disable-next-line no-console,lingui/no-unlocalized-strings
            console.log('[STT] streamInsert error:', error);
        }

        if (rms > SILENCE_THRESHOLD) {
            resetSilenceTimeout(sessionId);
        }
    };

    const startRecording = () => {
        void cleanupRecorder();
        const sessionId = session.startNewSession();

        resetRecordingState();

        runStreamTranscription();

        setTimeout(() => {
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
        }, 100);
    };

    useEffect(
        () => () => void cleanupRecorder(),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const transcription: TranscriptionState = {
        committed: '',
        partial: ''
    };

    return { startRecording, stopRecording, status, transcription, audioLevel, isVoiceDetected };
};
